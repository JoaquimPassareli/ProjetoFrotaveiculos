# ProjetoFrotaveiculos

Site para verificação de manutenções em uma frota de veículos, com frontend em React, backend em Node.js e persistência local via Local Storage.

## Tecnologias

- React (Vite)
- Node.js (Express)
- Local Storage (persistência local no navegador)

## Funcionalidades

- Cadastro de veículos (placa, modelo e quilometragem inicial)
- Registro de abastecimento
- Registro de manutenção
- Exibição de:
	- Último abastecimento
	- Quilometragem do veículo
	- Última manutenção
	- Lista de todas as manutenções feitas
- Somatória total de gastos com filtro por:
	- Abastecimento
	- Manutenção
	- Todos os gastos

## Estrutura

- `client/`: aplicação React
- `server/`: API Node.js (endpoint de status)

## Como executar

1. Instale as dependências na raiz:

```bash
npm install
```

2. Rode frontend e backend juntos:

```bash
npm run dev
```

3. Acesse no navegador:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000/api/ping

## Observações

- Os dados de veículos, abastecimentos e manutenções são salvos no Local Storage do navegador.
- O backend Node.js foi mantido simples para atender ao requisito de stack e status do serviço.