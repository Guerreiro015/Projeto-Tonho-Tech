# Arquitetura — TONHO TECH People

## Objetivo

Transformar o TONHO TECH People em uma plataforma modular de gestão de pessoas, processos e resultados.

## Estrutura planejada

```text
TonhoTechPeople/
├── app/                 # Áreas funcionais do produto
├── components/          # Componentes reutilizáveis de interface
├── core/                # Inicialização, roteamento, permissões e UI
├── services/            # Excel, IndexedDB, colaboradores, histórico
├── database/            # Estrutura futura de banco local/SQL
├── themes/              # Temas e identidade visual
├── assets/              # CSS, libs, imagens e logo
└── docs/                # Documentação do produto
```

## Princípios

1. Cada informação deve existir em apenas um lugar.
2. Nenhuma funcionalidade nova deve quebrar fluxo estável.
3. Perfis diferentes podem ter experiências diferentes.
4. Processos devem ser configuráveis sempre que possível.
5. O colaborador é o centro do sistema.
