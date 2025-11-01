// src/api/mobilityApi.ts
import { axiosClient } from "@/utils/axiosClient";

/** Interface simplificada - apenas o que o backend retorna */
export interface Vehicle {
  ordem: string;
  linha: string;
  latitude: number;
  longitude: number;
  datahora: number;
  velocidade: number;
  dist: number;
}

/** API simplificada - apenas o endpoint que você usa */
export const mobilityApi = {
  /**
   * Busca veículos próximos da FAETERJ
   * - windowSeconds: janela de tempo em segundos (padrão: 300 = 5 minutos)
   * - radiusMeters: raio em metros (padrão: 300m)
   * - includeStopped: incluir veículos parados (padrão: false)
   * - minSpeedKmh: velocidade mínima em km/h (padrão: 1)
   */
  async getNearbyVehicles(
    windowSeconds = 300,
    radiusMeters = 300,
    includeStopped = true,
    minSpeedKmh = 0,
  ): Promise<Vehicle[]> {
    try {
      const params = {
        windowSeconds,
        radiusMeters,
        includeStopped,
        minSpeedKmh,
      };
      const response = await axiosClient.get("/api/sppo/near", { params });

      // Converte os dados para garantir os tipos corretos
      const vehicles: Vehicle[] = (response.data || [])
        .map((item: any) => ({
          ordem: String(item.ordem || ""),
          linha: String(item.linha || ""),
          latitude: Number(item.latitude) || 0,
          longitude: Number(item.longitude) || 0,
          datahora: Number(item.datahora) || 0,
          velocidade: Number(item.velocidade) || 0,
          dist: Number(item.dist) || 0,
        }))
        .filter(
          (vehicle: Vehicle) =>
            vehicle.latitude !== 0 &&
            vehicle.longitude !== 0 &&
            vehicle.ordem !== "",
        );

      return vehicles;
    } catch (error) {
      return [];
    }
  },
};
