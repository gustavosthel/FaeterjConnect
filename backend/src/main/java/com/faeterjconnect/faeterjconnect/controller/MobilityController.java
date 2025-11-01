package com.faeterjconnect.faeterjconnect.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class MobilityController {

    // Coordenadas do campus (FAETERJ Quintino)
    private static final double CAMPUS_LAT = -22.892172;
    private static final double CAMPUS_LNG = -43.3238892;

    @GetMapping("/sppo/near")
    public ResponseEntity<List<NearbyVehicleDTO>> getSppoNear(
            @RequestParam(required = false) Integer windowSeconds,
            @RequestParam(required = false) Integer radiusMeters,
            @RequestParam(required = false, defaultValue = "true") Boolean includeStopped,
            @RequestParam(required = false, defaultValue = "0") Double minSpeedKmh,
            @RequestParam(required = false) String dataInicial,
            @RequestParam(required = false) String dataFinal
    ) {
        String url = null;
        try {
            // 1) Define janela
            String di = dataInicial;
            String df = dataFinal;
            if (di == null || df == null) {
                int win = (windowSeconds != null ? windowSeconds : 300);
                long nowMs = System.currentTimeMillis();
                long fromMs = nowMs - (win * 1000L);
                di = formatForApi(fromMs);
                df = formatForApi(nowMs);
            }
            // RAIO REDUZIDO PARA 1000 METROS (apenas os mais próximos)
            int radius = (radiusMeters != null ? radiusMeters : 50);

            // 2) Chama a API externa
            url = String.format(
                    "https://dados.mobilidade.rio/gps/sppo?dataInicial=%s&dataFinal=%s",
                    URLEncoder.encode(di, StandardCharsets.UTF_8),
                    URLEncoder.encode(df, StandardCharsets.UTF_8)
            );

            HttpClient client = HttpClient.newBuilder().build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            long t0 = System.currentTimeMillis();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            long dt = System.currentTimeMillis() - t0;

            if (response.statusCode() != 200) {
                return ResponseEntity.status(response.statusCode())
                        .header("X-Request-URL", url)
                        .build();
            }

            // 3) Parse JSON cru
            ObjectMapper om = new ObjectMapper();
            List<Map<String, Object>> raw = om.readValue(response.body(), new TypeReference<List<Map<String, Object>>>() {});

            // 4) Normaliza + filtra inválidos (lat/lon)
            List<Vehicle> normalized = new ArrayList<>();
            int invalidCount = 0;
            int nullVehicleCount = 0;

            for (Map<String, Object> registro : raw) {
                Vehicle v = toVehicle(registro);
                if (v == null) {
                    nullVehicleCount++;
                    continue;
                }
                if (!isFinite(v.latitude) || !isFinite(v.longitude) || v.latitude == 0 || v.longitude == 0) {
                    invalidCount++;
                    continue;
                }
                normalized.add(v);
            }

            // 5) Dedup por ordem: só a última posição (maior epoch)
            Map<String, Vehicle> latestByOrder = new HashMap<>();
            for (Vehicle v : normalized) {
                if (v.ordem == null || v.ordem.isBlank()) continue;
                Vehicle cur = latestByOrder.get(v.ordem);
                if (cur == null || v.datahora > cur.datahora) {
                    latestByOrder.put(v.ordem, v);
                }
            }
            List<Vehicle> latest = new ArrayList<>(latestByOrder.values());

            // 6) Filtra por raio e velocidade (opcional)
            List<Vehicle> nearby = latest.stream()
                    .peek(v -> v.distMeters = haversineMeters(CAMPUS_LAT, CAMPUS_LNG, v.latitude, v.longitude))
                    .filter(v -> v.distMeters <= radius)
                    .filter(v -> includeStopped || v.velocidade >= Math.max(0, minSpeedKmh))
                    .sorted(Comparator.comparingDouble(v -> v.distMeters))
                    .collect(Collectors.toList());

            // 7) Logs
            long totalRaw = (raw != null ? raw.size() : -1);

            // 8) Constrói DTO
            List<NearbyVehicleDTO> out = nearby.stream()
                    .map(v -> new NearbyVehicleDTO(
                            v.ordem,
                            v.linha,
                            v.latitude,
                            v.longitude,
                            v.datahora,
                            v.velocidade,
                            Math.round(v.distMeters)
                    ))
                    .collect(Collectors.toList());

            return ResponseEntity.ok()
                    .header("X-Request-URL", url)
                    .body(out);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("X-Request-URL", url != null ? url : "N/A")
                    .build();
        }
    }

    /* ===================== Helpers ===================== */

    /** Converte registro cru do feed para Vehicle normalizado */
    private static Vehicle toVehicle(Map<String, Object> r) {
        try {
            Vehicle v = new Vehicle();

            v.ordem = getStringValue(r, "ordem", "ordem_onibus", "origem", "id", "codigo");
            v.linha = getStringValue(r, "linha", "servico", "route", "numero_linha");

            // Converte coordenadas com vírgula para double
            v.latitude = parseCoordinate(r.get("latitude"));
            v.longitude = parseCoordinate(r.get("longitude"));

            v.velocidade = parseCoordinate(r.get("velocidade"));

            // Data/hora - trata diferentes formatos
            Object datahoraObj = r.get("datahora");
            if (datahoraObj == null) {
                datahoraObj = r.get("timestamp");
            }

            long dh = toLong(datahoraObj);
            // se vier em ms, normaliza para segundos
            if (dh > 1_000_000_000_000L) dh = dh / 1000L;
            v.datahora = dh;

            return v;
        } catch (Exception e) {
            System.err.println("Erro ao converter veículo: " + e.getMessage());
            return null;
        }
    }

    /** Converte coordenadas com vírgula para double */
    private static double parseCoordinate(Object coordObj) {
        if (coordObj == null) return Double.NaN;

        try {
            String str = String.valueOf(coordObj).trim();

            // Substitui vírgula por ponto para parse correto
            str = str.replace(',', '.');

            // Remove caracteres não numéricos (exceto ponto e sinal de negativo)
            str = str.replaceAll("[^\\d.-]", "");

            if (str.isEmpty() || str.equals(".") || str.equals("-") || str.equals("-.")) {
                return Double.NaN;
            }

            return Double.parseDouble(str);
        } catch (NumberFormatException e) {
            System.err.println("Erro ao converter coordenada: '" + coordObj + "' - " + e.getMessage());
            return Double.NaN;
        }
    }

    /** Helper para obter string de campos alternativos */
    private static String getStringValue(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object value = map.get(key);
            if (value != null) {
                String str = String.valueOf(value).trim();
                if (!str.isEmpty() && !str.equals("null")) {
                    return str;
                }
            }
        }
        return null;
    }

    private static String str(Object o) {
        return (o == null ? null : String.valueOf(o));
    }

    private static double toDouble(Object o) {
        if (o == null) return Double.NaN;
        try {
            return parseCoordinate(o);
        } catch (Exception e) {
            return Double.NaN;
        }
    }

    private static long toLong(Object o) {
        if (o == null) return 0L;
        try {
            String str = String.valueOf(o);
            // Remove caracteres não numéricos
            str = str.replaceAll("[^\\d-]", "");
            return Long.parseLong(str);
        } catch (Exception e) {
            try {
                return (long) parseCoordinate(o);
            } catch (Exception ex) {
                return 0L;
            }
        }
    }

    private static boolean isFinite(double d) {
        return !Double.isNaN(d) && !Double.isInfinite(d);
    }

    /** Haversine (m) */
    private static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000d;
        double φ1 = Math.toRadians(lat1);
        double φ2 = Math.toRadians(lat2);
        double dφ = Math.toRadians(lat2 - lat1);
        double dλ = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dφ/2)*Math.sin(dφ/2) + Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)*Math.sin(dλ/2);
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    /** "YYYY-MM-DD HH:mm:ss" a partir de millis (timezone local) */
    private static String formatForApi(long millis) {
        DateTimeFormatter F = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());
        return F.format(Instant.ofEpochMilli(millis));
    }

    /* ===================== POJOs ===================== */

    /** Representa o veículo normalizado (interno) */
    private static class Vehicle {
        String ordem;
        String linha;
        double latitude;
        double longitude;
        long datahora;      // epoch (s)
        double velocidade;  // km/h
        double distMeters;  // calculado
    }

    /** DTO de saída (resolve o problema de generics ao serializar) */
    public static class NearbyVehicleDTO {
        private String ordem;
        private String linha;
        private double latitude;
        private double longitude;
        private long datahora;
        private double velocidade;
        private long dist;

        public NearbyVehicleDTO() {}

        public NearbyVehicleDTO(String ordem, String linha, double latitude, double longitude,
                                long datahora, double velocidade, long dist) {
            this.ordem = ordem;
            this.linha = linha;
            this.latitude = latitude;
            this.longitude = longitude;
            this.datahora = datahora;
            this.velocidade = velocidade;
            this.dist = dist;
        }

        public String getOrdem() { return ordem; }
        public String getLinha() { return linha; }
        public double getLatitude() { return latitude; }
        public double getLongitude() { return longitude; }
        public long getDatahora() { return datahora; }
        public double getVelocidade() { return velocidade; }
        public long getDist() { return dist; }

        public void setOrdem(String ordem) { this.ordem = ordem; }
        public void setLinha(String linha) { this.linha = linha; }
        public void setLatitude(double latitude) { this.latitude = latitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }
        public void setDatahora(long datahora) { this.datahora = datahora; }
        public void setVelocidade(double velocidade) { this.velocidade = velocidade; }
        public void setDist(long dist) { this.dist = dist; }
    }
}