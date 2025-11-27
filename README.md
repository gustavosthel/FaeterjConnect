
# 📡 Faeterj Connect

O FAETEJ Connect é uma plataforma desenvolvida para melhorar a comunicação interna da FAETEJ, uma instituição de ensino superior.
O objetivo é centralizar informações importantes e oferecer recursos que facilitem a vida acadêmica, como:


## Funcionalidades

- Comunicação rápida entre alunos e professores.
- Informações sobre eventos e avisos no campus.
- Localização de transporte que passa pela faculdade.
- Chat em tempo real para interação instantâne.
- Interface moderna e responsiva.


## 🛠 Tecnologias Utilizadas

Backend

- Java 21 com Spring Boot
- Spring Security para autenticação e autorização
- WebSocket para chat em tempo real
- PostgreSQL como banco de dados
- Maven para gerenciamento de dependências

Frontend

- React com TypeScript
- TailwindCSS para estilização
- Axios para integração com API
- Socket.IO ou WebSocket nativo para chat em tempo real


## 🚀 Como Executar o Projeto

Clone o projeto

```bash
  git clone https://github.com/seu-usuario/faetej-connect.git
```

Entre no diretório do projeto

```bash
  cd faetej-connect
```

Crie um arquivo .env no backend com

```bash
  SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/faetej
  SPRING_DATASOURCE_USERNAME=usuario
  SPRING_DATASOURCE_PASSWORD=senha
  JWT_SECRET=sua_chave_secreta
```

Rodar o backend

```bash
  
  cd backend
  mvn spring-boot:run

```

Rodar o frontend

```bash
  
  
  cd frontend
  npm install
  npm run dev


```


## 🔐 Segurança

- Autenticação via JWT
- Controle de acesso com Spring Security
- Proteção contra CSRF e CORS configurado


## 💬 Chat em Tempo Real

O chat é implementado usando WebSocket no backend e Socket.IO no frontend, garantindo:

- Comunicação bidirecional e instantânea
- Suporte para salas privadas (ex.: aluno ↔ professor)
- Persistência das mensagens no PostgreSQL
- Escalabilidade para múltiplos usuários simultâneos




## 📌 Roadmap

- Notificações push
- Integração com calendário acadêmico
- Mapa interativo do campus

## 📄 Licença

Projeto criado para fins de estudo e prática.

## 👥  Desenvolvedores
### 💙 Nathaly Pereira - @metataly
### 💙 Gustavo Sthel - @gustavosthel
