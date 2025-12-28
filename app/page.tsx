'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { LeafletMap, type HeatLayer } from './components/LeafletMap';

const heatmapLayers: HeatLayer[] = [
  {
    id: 'demanda',
    label: 'Demanda / Leads',
    color: '#2563eb',
    hotspots: [
      { position: [-23.603, -46.664], intensity: 'HIGH' },
      { position: [-23.589, -46.635], intensity: 'MED' },
      { position: [-23.586, -46.676], intensity: 'HIGH' },
      { position: [-23.567, -46.691], intensity: 'MED' },
    ],
  },
  {
    id: 'vendidos',
    label: 'Imóveis Vendidos',
    color: '#16a34a',
    hotspots: [
      { position: [-23.565, -46.664], intensity: 'HIGH' },
      { position: [-23.586, -46.676], intensity: 'HIGH' },
      { position: [-23.61, -46.698], intensity: 'MED' },
      { position: [-23.595, -46.685], intensity: 'MED' },
    ],
  },
  {
    id: 'cobertura',
    label: 'Cobertura de Corretores',
    color: '#ea7a1f',
    hotspots: [
      { position: [-23.567, -46.691], intensity: 'HIGH' },
      { position: [-23.586, -46.676], intensity: 'HIGH' },
      { position: [-23.626, -46.674], intensity: 'MED' },
      { position: [-23.653, -46.714], intensity: 'LOW-MED' },
    ],
  },
  {
    id: 'noshow',
    label: 'Risco de No-Show',
    color: '#b91c1c',
    hotspots: [
      { position: [-23.603, -46.664], intensity: 'MED-HIGH' },
      { position: [-23.589, -46.635], intensity: 'MED' },
      { position: [-23.54, -46.576], intensity: 'HIGH' },
      { position: [-23.501, -46.624], intensity: 'MED' },
    ],
  },
];

const layerDefinitions: Record<string, string> = {
  demanda: 'Onde a intenção do comprador está concentrada.',
  vendidos: 'Onde o volume de fechamentos está acontecendo.',
  cobertura: 'Capacidade de atendimento dos corretores na região.',
  noshow: 'Probabilidade maior de cancelamento ou ausência em visitas.',
};

const assistantTexts: Record<string, string> = {
  demanda: 'A demanda está concentrada; priorize resposta rápida, triagem de lead e distribuição equilibrada entre corretores com maior disponibilidade.',
  vendidos: 'As vendas estão fortes; capture aprendizados do playbook local e replique a abordagem comercial e de marketing em zonas vizinhas.',
  cobertura: 'Cobertura robusta; direcione times para outreach proativo, visitas guiadas e follow-up dentro de 30 minutos.',
  noshow: 'Risco elevado de no-show; implemente confirmações em dois passos, buffers na agenda e lembretes personalizados.',
  'demanda-vendidos': 'Demanda e fechamentos andam juntos; aumente orçamento de mídia, reforce pré-venda e mantenha SLA de contato para sustentar o pico.',
  'demanda-cobertura': 'Intenção alta com equipe preparada; acione campanhas táticas, rotas otimizadas e ofertas relâmpago para conversão imediata.',
  'demanda-noshow': 'Interesse alto, mas risco de faltas; automatize confirmações, ofereça reagendamento rápido e use incentivos de presença.',
  'vendidos-cobertura': 'Fechamentos fortes com cobertura sólida; use as lojas como laboratório de boas práticas e aumente o alcance de prospecção.',
  'vendidos-noshow': 'Fechamentos convivem com risco; blinde a operação com check-ins prévios, listas de espera e suporte de concierge.',
  'cobertura-noshow': 'Equipe disponível, porém cancelamentos frequentes; revise qualificação de lead, scripts de confirmação e janelas de reagendamento.',
};

type CityMetrics = {
  nome: string;
  indice: number;
  negocios: number;
  volume: number;
  conversao: number;
  ativos: number;
  marketing: number;
};

type StateMetrics = {
  uf: string;
  indice: number;
  medianaIndice: number;
  medianaNacional: number;
  trend: { mes: string; valor: number }[];
  cities: CityMetrics[];
  marketingResumo: {
    investimento: number;
    negocios: number;
    cac: number;
    roi: number;
  };
  receitaSplit: { name: string; value: number }[];
  receitaCanais: { name: string; value: number }[];
  lojasMelhores: { loja: string; cidade: string; indice: number }[];
  lojasPiores: { loja: string; cidade: string; indice: number }[];
};

type PerformanceDataset = {
  nome: string;
  states: StateMetrics[];
};

const tendenciaPadrao = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
].map((mes, idx) => ({ mes, valor: 60 + idx * 2 - (idx % 3 === 0 ? 5 : 0) }));

const cidadesPorEstado: Record<string, CityMetrics[]> = {
  SP: [
    { nome: 'São Paulo', indice: 86, negocios: 420, volume: 58, conversao: 18, ativos: 140, marketing: 820 },
    { nome: 'Campinas', indice: 78, negocios: 220, volume: 32, conversao: 16, ativos: 80, marketing: 410 },
    { nome: 'São José dos Campos', indice: 72, negocios: 185, volume: 28, conversao: 14, ativos: 70, marketing: 360 },
    { nome: 'Santos', indice: 74, negocios: 160, volume: 26, conversao: 15, ativos: 65, marketing: 300 },
    { nome: 'Ribeirão Preto', indice: 69, negocios: 140, volume: 24, conversao: 13, ativos: 60, marketing: 280 },
  ],
  RJ: [
    { nome: 'Rio de Janeiro', indice: 79, negocios: 310, volume: 44, conversao: 17, ativos: 110, marketing: 650 },
    { nome: 'Niterói', indice: 73, negocios: 170, volume: 26, conversao: 15, ativos: 70, marketing: 320 },
    { nome: 'Campos', indice: 64, negocios: 120, volume: 18, conversao: 12, ativos: 55, marketing: 210 },
    { nome: 'Petrópolis', indice: 66, negocios: 100, volume: 17, conversao: 13, ativos: 48, marketing: 190 },
    { nome: 'Volta Redonda', indice: 62, negocios: 95, volume: 15, conversao: 12, ativos: 46, marketing: 180 },
  ],
  MG: [
    { nome: 'Belo Horizonte', indice: 75, negocios: 250, volume: 36, conversao: 15, ativos: 95, marketing: 500 },
    { nome: 'Uberlândia', indice: 70, negocios: 170, volume: 26, conversao: 14, ativos: 70, marketing: 330 },
    { nome: 'Juiz de Fora', indice: 63, negocios: 120, volume: 18, conversao: 12, ativos: 55, marketing: 210 },
    { nome: 'Uberaba', indice: 61, negocios: 110, volume: 17, conversao: 12, ativos: 50, marketing: 190 },
    { nome: 'Contagem', indice: 65, negocios: 125, volume: 18, conversao: 12, ativos: 52, marketing: 195 },
  ],
  PR: [
    { nome: 'Curitiba', indice: 77, negocios: 230, volume: 34, conversao: 16, ativos: 90, marketing: 460 },
    { nome: 'Londrina', indice: 69, negocios: 160, volume: 22, conversao: 14, ativos: 65, marketing: 280 },
    { nome: 'Maringá', indice: 67, negocios: 150, volume: 20, conversao: 13, ativos: 62, marketing: 260 },
    { nome: 'Ponta Grossa', indice: 62, negocios: 110, volume: 16, conversao: 11, ativos: 50, marketing: 190 },
    { nome: 'Cascavel', indice: 60, negocios: 100, volume: 15, conversao: 11, ativos: 48, marketing: 185 },
  ],
  SC: [
    { nome: 'Florianópolis', indice: 74, negocios: 210, volume: 32, conversao: 15, ativos: 80, marketing: 420 },
    { nome: 'Joinville', indice: 70, negocios: 180, volume: 27, conversao: 14, ativos: 70, marketing: 330 },
    { nome: 'Blumenau', indice: 65, negocios: 140, volume: 20, conversao: 12, ativos: 58, marketing: 240 },
    { nome: 'Itajaí', indice: 68, negocios: 150, volume: 23, conversao: 13, ativos: 60, marketing: 260 },
    { nome: 'Chapecó', indice: 61, negocios: 110, volume: 16, conversao: 11, ativos: 50, marketing: 190 },
  ],
  RS: [
    { nome: 'Porto Alegre', indice: 72, negocios: 200, volume: 30, conversao: 14, ativos: 82, marketing: 380 },
    { nome: 'Caxias do Sul', indice: 67, negocios: 150, volume: 22, conversao: 12, ativos: 64, marketing: 260 },
    { nome: 'Pelotas', indice: 60, negocios: 110, volume: 16, conversao: 10, ativos: 50, marketing: 190 },
    { nome: 'Santa Maria', indice: 62, negocios: 115, volume: 17, conversao: 11, ativos: 52, marketing: 195 },
    { nome: 'Novo Hamburgo', indice: 64, negocios: 120, volume: 18, conversao: 12, ativos: 54, marketing: 200 },
  ],
  BA: [
    { nome: 'Salvador', indice: 70, negocios: 190, volume: 28, conversao: 13, ativos: 78, marketing: 350 },
    { nome: 'Feira de Santana', indice: 62, negocios: 130, volume: 18, conversao: 11, ativos: 56, marketing: 210 },
    { nome: 'Lauro de Freitas', indice: 65, negocios: 125, volume: 19, conversao: 12, ativos: 52, marketing: 200 },
    { nome: 'Vitória da Conquista', indice: 60, negocios: 110, volume: 16, conversao: 11, ativos: 48, marketing: 185 },
    { nome: 'Camaçari', indice: 61, negocios: 115, volume: 17, conversao: 11, ativos: 50, marketing: 190 },
  ],
  DF: [
    { nome: 'Brasília', indice: 76, negocios: 240, volume: 35, conversao: 16, ativos: 88, marketing: 420 },
    { nome: 'Águas Claras', indice: 70, negocios: 180, volume: 26, conversao: 15, ativos: 72, marketing: 330 },
    { nome: 'Taguatinga', indice: 66, negocios: 150, volume: 22, conversao: 13, ativos: 64, marketing: 260 },
    { nome: 'Ceilândia', indice: 60, negocios: 120, volume: 18, conversao: 11, ativos: 55, marketing: 210 },
    { nome: 'Guará', indice: 64, negocios: 130, volume: 19, conversao: 12, ativos: 58, marketing: 230 },
  ],
};

const buildState = (uf: string, ajuste: number): StateMetrics => {
  const cities = cidadesPorEstado[uf].map((city) => ({
    ...city,
    indice: Math.min(100, city.indice + ajuste),
    volume: city.volume + Math.max(0, ajuste / 5),
    conversao: Math.min(25, city.conversao + Math.max(0, ajuste / 10)),
  }));
  const indice = Math.round(
    cities.reduce((acc, city) => acc + city.indice, 0) / cities.length,
  );
  return {
    uf,
    indice,
    medianaIndice: Math.max(55, indice - 8),
    medianaNacional: 68 + ajuste,
    trend: tendenciaPadrao.map((p) => ({ ...p, valor: Math.max(50, p.valor + ajuste) })),
    cities,
    marketingResumo: {
      investimento: 400 + ajuste * 6,
      negocios: 140 + ajuste * 2,
      cac: 11 - ajuste * 0.05,
      roi: 140 + ajuste * 1.5,
    },
    receitaSplit: [
      { name: 'Primário', value: 62 + ajuste / 2 },
      { name: 'Secundário', value: 38 - ajuste / 2 },
    ],
    receitaCanais: [
      { name: 'Orgânico', value: 32 + ajuste / 4 },
      { name: 'Mídia Paga', value: 36 + ajuste / 3 },
      { name: 'Indicações', value: 18 - ajuste / 4 },
      { name: 'Parcerias', value: 14 - ajuste / 6 },
    ],
    lojasMelhores: cities
      .slice(0, 5)
      .map((city, idx) => ({ loja: `Loja ${idx + 1}`, cidade: city.nome, indice: city.indice })),
    lojasPiores: cities
      .slice()
      .reverse()
      .slice(0, 5)
      .map((city, idx) => ({ loja: `Loja B${idx + 1}`, cidade: city.nome, indice: Math.max(52, city.indice - 12) })),
  };
};

const lojasLopesData: PerformanceDataset = {
  nome: 'Lojas Lopes',
  states: ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'DF'].map((uf, idx) => buildState(uf, 6 - idx)),
};

const franchisesData: PerformanceDataset = {
  nome: 'Franquias',
  states: ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'DF'].map((uf, idx) => buildState(uf, 2 - idx)),
};

type Project = {
  id: string;
  nome: string;
  incorporadora: string;
  estado: string;
  cidade: string;
  unidades: number;
  vendido: number;
  status: 'Lançamento' | 'Em Vendas' | 'Entrega Próxima' | 'Concluído';
  lojasVsFranquias: { lojas: number; franquias: number };
  financeiro: {
    custoTotal: number;
    precoMedio: string;
    vgvEsperado: number;
    vgvRealizado: number;
    roiEsperado: number;
    roiReal: number;
  };
  inventario: {
    total: number;
    vendidas: number;
    restantes: number;
    velocidade: string;
    conversao: string;
    cancelamento: string;
  };
  funnel: {
    leads: number;
    agendadas: number;
    realizadas: number;
    propostas: number;
    contratos: number;
  };
  timeline: {
    lancamento: string;
    entrega: string;
    semanasNoMercado: number;
  };
  vendidosAoTempo: { mes: string; unidades: number }[];
  roiComparativo: { nome: string; valor: number }[];
  resultadoFinal?: 'Acima do Plano' | 'No Plano' | 'Abaixo do Plano';
  insights?: string[];
};

const incorporadoras = [
  'Cyrela',
  'Even',
  'Helbor',
  'Tecnisa',
  'Tegra',
  'Plano & Plano',
  'Mitre Realty',
  'Kallas',
  'Tibério',
  'Setin',
  'Patriani',
  'Direcional',
  'Diálogo',
  'Moura Dubeux',
];

const projetosAtivos: Project[] = [
  {
    id: 'sp-moema-a',
    nome: 'Aura Moema',
    incorporadora: 'Cyrela',
    estado: 'SP',
    cidade: 'São Paulo',
    unidades: 180,
    vendido: 64,
    status: 'Em Vendas',
    lojasVsFranquias: { lojas: 70, franquias: 30 },
    financeiro: {
      custoTotal: 185,
      precoMedio: 'R$ 1,6M - R$ 2,3M',
      vgvEsperado: 320,
      vgvRealizado: 205,
      roiEsperado: 32,
      roiReal: 29,
    },
    inventario: {
      total: 180,
      vendidas: 115,
      restantes: 65,
      velocidade: '18 unid/mês',
      conversao: '12,4%',
      cancelamento: '3,2%',
    },
    funnel: {
      leads: 1480,
      agendadas: 620,
      realizadas: 510,
      propostas: 180,
      contratos: 115,
    },
    timeline: {
      lancamento: '03/2024',
      entrega: '09/2026',
      semanasNoMercado: 42,
    },
    vendidosAoTempo: [
      { mes: 'Jan', unidades: 14 },
      { mes: 'Fev', unidades: 18 },
      { mes: 'Mar', unidades: 22 },
      { mes: 'Abr', unidades: 19 },
      { mes: 'Mai', unidades: 21 },
    ],
    roiComparativo: [
      { nome: 'Projetado', valor: 32 },
      { nome: 'Real', valor: 29 },
    ],
  },
  {
    id: 'sp-itaim-b',
    nome: 'Signature Itaim',
    incorporadora: 'Even',
    estado: 'SP',
    cidade: 'São Paulo',
    unidades: 140,
    vendido: 58,
    status: 'Lançamento',
    lojasVsFranquias: { lojas: 60, franquias: 40 },
    financeiro: {
      custoTotal: 150,
      precoMedio: 'R$ 1,2M - R$ 1,9M',
      vgvEsperado: 260,
      vgvRealizado: 150,
      roiEsperado: 28,
      roiReal: 24,
    },
    inventario: {
      total: 140,
      vendidas: 81,
      restantes: 59,
      velocidade: '15 unid/mês',
      conversao: '11,7%',
      cancelamento: '2,5%',
    },
    funnel: {
      leads: 1220,
      agendadas: 540,
      realizadas: 430,
      propostas: 170,
      contratos: 81,
    },
    timeline: {
      lancamento: '05/2024',
      entrega: '01/2027',
      semanasNoMercado: 30,
    },
    vendidosAoTempo: [
      { mes: 'Jan', unidades: 12 },
      { mes: 'Fev', unidades: 15 },
      { mes: 'Mar', unidades: 17 },
      { mes: 'Abr', unidades: 18 },
      { mes: 'Mai', unidades: 19 },
    ],
    roiComparativo: [
      { nome: 'Projetado', valor: 28 },
      { nome: 'Real', valor: 24 },
    ],
  },
  {
    id: 'sp-vilaolimpia',
    nome: 'Horizonte Vila Olímpia',
    incorporadora: 'Mitre Realty',
    estado: 'SP',
    cidade: 'São Paulo',
    unidades: 200,
    vendido: 72,
    status: 'Entrega Próxima',
    lojasVsFranquias: { lojas: 55, franquias: 45 },
    financeiro: {
      custoTotal: 210,
      precoMedio: 'R$ 1,1M - R$ 1,8M',
      vgvEsperado: 350,
      vgvRealizado: 295,
      roiEsperado: 30,
      roiReal: 31,
    },
    inventario: {
      total: 200,
      vendidas: 144,
      restantes: 56,
      velocidade: '16 unid/mês',
      conversao: '12,1%',
      cancelamento: '2,1%',
    },
    funnel: {
      leads: 1520,
      agendadas: 640,
      realizadas: 520,
      propostas: 220,
      contratos: 144,
    },
    timeline: {
      lancamento: '11/2023',
      entrega: '02/2026',
      semanasNoMercado: 58,
    },
    vendidosAoTempo: [
      { mes: 'Jan', unidades: 18 },
      { mes: 'Fev', unidades: 20 },
      { mes: 'Mar', unidades: 22 },
      { mes: 'Abr', unidades: 21 },
      { mes: 'Mai', unidades: 19 },
    ],
    roiComparativo: [
      { nome: 'Projetado', valor: 30 },
      { nome: 'Real', valor: 31 },
    ],
  },
  {
    id: 'rj-barra',
    nome: 'Brisa Barra',
    incorporadora: 'Tegra',
    estado: 'RJ',
    cidade: 'Rio de Janeiro',
    unidades: 160,
    vendido: 55,
    status: 'Em Vendas',
    lojasVsFranquias: { lojas: 65, franquias: 35 },
    financeiro: {
      custoTotal: 160,
      precoMedio: 'R$ 950k - R$ 1,5M',
      vgvEsperado: 240,
      vgvRealizado: 165,
      roiEsperado: 26,
      roiReal: 23,
    },
    inventario: {
      total: 160,
      vendidas: 104,
      restantes: 56,
      velocidade: '14 unid/mês',
      conversao: '10,8%',
      cancelamento: '3,8%',
    },
    funnel: {
      leads: 1340,
      agendadas: 520,
      realizadas: 430,
      propostas: 180,
      contratos: 104,
    },
    timeline: {
      lancamento: '02/2024',
      entrega: '10/2026',
      semanasNoMercado: 38,
    },
    vendidosAoTempo: [
      { mes: 'Jan', unidades: 14 },
      { mes: 'Fev', unidades: 16 },
      { mes: 'Mar', unidades: 18 },
      { mes: 'Abr', unidades: 19 },
      { mes: 'Mai', unidades: 17 },
    ],
    roiComparativo: [
      { nome: 'Projetado', valor: 26 },
      { nome: 'Real', valor: 23 },
    ],
  },
];

const projetosAntigos: Project[] = [
  {
    id: 'sp-panamby',
    nome: 'Panamby Prime',
    incorporadora: 'Diálogo',
    estado: 'SP',
    cidade: 'São Paulo',
    unidades: 150,
    vendido: 100,
    status: 'Concluído',
    lojasVsFranquias: { lojas: 68, franquias: 32 },
    financeiro: {
      custoTotal: 140,
      precoMedio: 'R$ 1,1M - R$ 1,7M',
      vgvEsperado: 260,
      vgvRealizado: 275,
      roiEsperado: 24,
      roiReal: 28,
    },
    inventario: {
      total: 150,
      vendidas: 150,
      restantes: 0,
      velocidade: '17 unid/mês',
      conversao: '12,8%',
      cancelamento: '2,0%',
    },
    funnel: {
      leads: 1800,
      agendadas: 720,
      realizadas: 610,
      propostas: 210,
      contratos: 150,
    },
    timeline: {
      lancamento: '01/2022',
      entrega: '09/2024',
      semanasNoMercado: 110,
    },
    vendidosAoTempo: [
      { mes: '1T', unidades: 40 },
      { mes: '2T', unidades: 38 },
      { mes: '3T', unidades: 36 },
      { mes: '4T', unidades: 36 },
    ],
    roiComparativo: [
      { nome: 'Projetado', valor: 24 },
      { nome: 'Real', valor: 28 },
    ],
    resultadoFinal: 'Acima do Plano',
    insights: [
      'Campanhas de mídia paga com foco em plantas maiores tiveram ROI 1,6x.',
      'Parceria com Helbor acelerou liberação de estoque premium.',
      'Follow-up híbrido (online + presencial) reduziu cancelamentos em 15%.',
    ],
  },
  {
    id: 'rj-leblon',
    nome: 'Leblon Atlântico',
    incorporadora: 'Moura Dubeux',
    estado: 'RJ',
    cidade: 'Rio de Janeiro',
    unidades: 120,
    vendido: 100,
    status: 'Concluído',
    lojasVsFranquias: { lojas: 62, franquias: 38 },
    financeiro: {
      custoTotal: 150,
      precoMedio: 'R$ 1,5M - R$ 2,4M',
      vgvEsperado: 280,
      vgvRealizado: 268,
      roiEsperado: 26,
      roiReal: 25,
    },
    inventario: {
      total: 120,
      vendidas: 120,
      restantes: 0,
      velocidade: '15 unid/mês',
      conversao: '11,2%',
      cancelamento: '2,7%',
    },
    funnel: {
      leads: 1600,
      agendadas: 640,
      realizadas: 520,
      propostas: 200,
      contratos: 120,
    },
    timeline: {
      lancamento: '06/2021',
      entrega: '03/2024',
      semanasNoMercado: 140,
    },
    vendidosAoTempo: [
      { mes: '1T', unidades: 30 },
      { mes: '2T', unidades: 28 },
      { mes: '3T', unidades: 32 },
      { mes: '4T', unidades: 30 },
    ],
    roiComparativo: [
      { nome: 'Projetado', valor: 26 },
      { nome: 'Real', valor: 25 },
    ],
    resultadoFinal: 'No Plano',
    insights: [
      'Campanhas com lifestyle local tiveram engajamento 2,1x maior.',
      'Agendamento digital reduziu tempo médio de visita para 2 dias.',
      'Mix de plantas menores acelerou vendas no último trimestre.',
    ],
  },
  {
    id: 'mg-bh',
    nome: 'Horizonte Savassi',
    incorporadora: 'Patriani',
    estado: 'MG',
    cidade: 'Belo Horizonte',
    unidades: 130,
    vendido: 100,
    status: 'Concluído',
    lojasVsFranquias: { lojas: 58, franquias: 42 },
    financeiro: {
      custoTotal: 120,
      precoMedio: 'R$ 890k - R$ 1,4M',
      vgvEsperado: 210,
      vgvRealizado: 195,
      roiEsperado: 22,
      roiReal: 20,
    },
    inventario: {
      total: 130,
      vendidas: 130,
      restantes: 0,
      velocidade: '14 unid/mês',
      conversao: '10,5%',
      cancelamento: '3,5%',
    },
    funnel: {
      leads: 1400,
      agendadas: 540,
      realizadas: 430,
      propostas: 180,
      contratos: 130,
    },
    timeline: {
      lancamento: '09/2021',
      entrega: '07/2024',
      semanasNoMercado: 125,
    },
    vendidosAoTempo: [
      { mes: '1T', unidades: 28 },
      { mes: '2T', unidades: 32 },
      { mes: '3T', unidades: 34 },
      { mes: '4T', unidades: 36 },
    ],
    roiComparativo: [
      { nome: 'Projetado', valor: 22 },
      { nome: 'Real', valor: 20 },
    ],
    resultadoFinal: 'Abaixo do Plano',
    insights: [
      'Dependência alta de mídia paga elevou CAC final.',
      'Conversão caiu após reajuste de preço no 3º trimestre.',
      'Parcerias com imobiliárias locais geraram melhor ROI do que mídia digital.',
    ],
  },
];

const parceriasRank = [
  {
    nome: 'Cyrela',
    projetos: 12,
    unidades: 1650,
    vgv: 2380,
    roiMedio: 27,
    tempoMedio: 46,
    destaque: 'São Paulo / SP',
    roiPorProjeto: [22, 28, 30, 26, 29],
    tempoPorProjeto: [42, 44, 48, 46, 50],
  },
  {
    nome: 'Even',
    projetos: 9,
    unidades: 1210,
    vgv: 1820,
    roiMedio: 24,
    tempoMedio: 50,
    destaque: 'Campinas / SP',
    roiPorProjeto: [20, 24, 25, 26],
    tempoPorProjeto: [48, 52, 50, 51],
  },
  {
    nome: 'Moura Dubeux',
    projetos: 7,
    unidades: 1080,
    vgv: 1520,
    roiMedio: 23,
    tempoMedio: 52,
    destaque: 'Recife / PE',
    roiPorProjeto: [22, 23, 24, 21],
    tempoPorProjeto: [50, 54, 55, 49],
  },
  {
    nome: 'Patriani',
    projetos: 6,
    unidades: 940,
    vgv: 1280,
    roiMedio: 21,
    tempoMedio: 55,
    destaque: 'Belo Horizonte / MG',
    roiPorProjeto: [19, 20, 23, 22],
    tempoPorProjeto: [53, 56, 55, 57],
  },
  {
    nome: 'Tecnisa',
    projetos: 5,
    unidades: 820,
    vgv: 1180,
    roiMedio: 22,
    tempoMedio: 54,
    destaque: 'Curitiba / PR',
    roiPorProjeto: [20, 23, 22],
    tempoPorProjeto: [52, 55, 54],
  },
  {
    nome: 'Mitre Realty',
    projetos: 5,
    unidades: 780,
    vgv: 1100,
    roiMedio: 23,
    tempoMedio: 51,
    destaque: 'São Paulo / SP',
    roiPorProjeto: [22, 24, 23],
    tempoPorProjeto: [50, 52, 51],
  },
  {
    nome: 'Direcional',
    projetos: 5,
    unidades: 760,
    vgv: 980,
    roiMedio: 20,
    tempoMedio: 58,
    destaque: 'Brasília / DF',
    roiPorProjeto: [19, 20, 21],
    tempoPorProjeto: [56, 59, 57],
  },
  {
    nome: 'Plano & Plano',
    projetos: 4,
    unidades: 620,
    vgv: 820,
    roiMedio: 19,
    tempoMedio: 60,
    destaque: 'Salvador / BA',
    roiPorProjeto: [18, 19, 20],
    tempoPorProjeto: [58, 61, 60],
  },
];

const availableStates = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'DF'];

const ResizableResponsiveContainer = dynamic(
  async () => (await import('recharts')).ResponsiveContainer,
  { ssr: false },
);
const BarChart = dynamic(async () => (await import('recharts')).BarChart, { ssr: false });
const Bar = dynamic(async () => (await import('recharts')).Bar, { ssr: false });
const XAxis = dynamic(async () => (await import('recharts')).XAxis, { ssr: false });
const YAxis = dynamic(async () => (await import('recharts')).YAxis, { ssr: false });
const CartesianGrid = dynamic(async () => (await import('recharts')).CartesianGrid, { ssr: false });
const TooltipChart = dynamic(async () => (await import('recharts')).Tooltip, { ssr: false });
const Legend = dynamic(async () => (await import('recharts')).Legend, { ssr: false });
const LineChart = dynamic(async () => (await import('recharts')).LineChart, { ssr: false });
const Line = dynamic(async () => (await import('recharts')).Line, { ssr: false });
const PieChart = dynamic(async () => (await import('recharts')).PieChart, { ssr: false });
const Pie = dynamic(async () => (await import('recharts')).Pie, { ssr: false });
const Cell = dynamic(async () => (await import('recharts')).Cell, { ssr: false });

const palette = {
  border: '#efe9d7',
  text: '#1f2937',
  gold: '#d4af37',
  goldSoft: '#e8d9a8',
  red: '#8b0000',
};

type TabId = 'analise' | 'performance' | 'projetos' | 'ia' | 'config';
type PerformanceModo = 'lojas' | 'franquias' | null;
type ProjetoModo = 'ativos' | 'antigos';

type Mensagem = {
  remetente: 'assistente' | 'usuario';
  texto: string;
};

function Page() {
  const [activeTab, setActiveTab] = useState<TabId>('analise');
  const [mapLayers, setMapLayers] = useState<string[]>(['demanda', 'vendidos']);
  const [performanceModo, setPerformanceModo] = useState<PerformanceModo>('lojas');
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>('SP');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('São Paulo');
  const [projetoModo, setProjetoModo] = useState<ProjetoModo>('ativos');
  const [estadoProjeto, setEstadoProjeto] = useState<string>('SP');
  const [cidadeProjeto, setCidadeProjeto] = useState<string>('São Paulo');
  const [projetoSelecionado, setProjetoSelecionado] = useState<Project | null>(projetosAtivos[0]);
  const [parceriaSelecionada, setParceriaSelecionada] = useState(parceriasRank[0]);
  const [chatMessages, setChatMessages] = useState<Mensagem[]>([
    { remetente: 'assistente', texto: 'Olá! Pronto para apoiar decisões com os painéis de performance e projetos.' },
    { remetente: 'assistente', texto: 'Vejo demanda concentrada em Moema e Itaim, enquanto a cobertura de corretores está menor em Vila Mariana.' },
    { remetente: 'assistente', texto: 'Nos projetos primários, ROI real médio está 3 p.p. abaixo do esperado em campanhas digitais.' },
    { remetente: 'assistente', texto: 'Entre as franquias, SC teve a melhor conversão das últimas 12 semanas.' },
  ]);
  const [inputChat, setInputChat] = useState('');
  const [warningChat, setWarningChat] = useState('');

  const datasetAtivo = performanceModo === 'lojas' ? lojasLopesData : franchisesData;

  const estadoData = useMemo(() => {
    return datasetAtivo.states.find((s) => s.uf === estadoSelecionado) ?? datasetAtivo.states[0];
  }, [datasetAtivo, estadoSelecionado]);

  const cidadeData = useMemo(() => {
    return estadoData.cities.find((c) => c.nome === cidadeSelecionada) ?? estadoData.cities[0];
  }, [estadoData, cidadeSelecionada]);

  const cidadesDisponiveis = estadoData.cities.map((c) => c.nome);

  const projetosCidadeList = useMemo(() => {
    const listaBase = projetoModo === 'ativos' ? projetosAtivos : projetosAntigos;
    return listaBase.filter((p) => p.estado === estadoProjeto);
  }, [projetoModo, estadoProjeto]);

  const selectedAssistantKey = useMemo(() => {
    if (mapLayers.length === 1) return mapLayers[0];
    if (mapLayers.length === 2) return mapLayers.slice().sort().join('-');
    return null;
  }, [mapLayers]);

  useEffect(() => {
    const listaBase = projetoModo === 'ativos' ? projetosAtivos : projetosAntigos;
    const prox =
      listaBase.find((p) => p.estado === estadoProjeto && p.cidade === cidadeProjeto) ??
      listaBase.find((p) => p.estado === estadoProjeto) ??
      listaBase[0] ??
      null;
    setProjetoSelecionado(prox);
  }, [projetoModo, estadoProjeto, cidadeProjeto]);

  const sendChat = () => {
    if (!inputChat.trim()) return;
    setChatMessages((prev) => [...prev, { remetente: 'usuario', texto: inputChat.trim() }]);
    setWarningChat('Demo: o agente ainda não está conectado aos dados.');
    setInputChat('');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        <Sidebar activeTab={activeTab} onChange={setActiveTab} />
        <main className="flex-1 bg-[#fdfbf6] px-8 pb-10 pt-6">
          {activeTab === 'analise' && (
            <AnaliseTab
              mapLayers={mapLayers}
              setMapLayers={setMapLayers}
              selectedAssistantKey={selectedAssistantKey}
            />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab
              performanceModo={performanceModo}
              setPerformanceModo={setPerformanceModo}
              estadoSelecionado={estadoSelecionado}
              setEstadoSelecionado={(uf) => {
                setEstadoSelecionado(uf);
                const novaCidade = (datasetAtivo.states.find((s) => s.uf === uf)?.cities[0]?.nome) ?? 'Cidade';
                setCidadeSelecionada(novaCidade);
              }}
              cidadeSelecionada={cidadeSelecionada}
              setCidadeSelecionada={setCidadeSelecionada}
              datasetAtivo={datasetAtivo}
              estadoData={estadoData}
              cidadeData={cidadeData}
              cidadesDisponiveis={cidadesDisponiveis}
            />
          )}
          {activeTab === 'projetos' && (
            <ProjetosTab
              projetoModo={projetoModo}
              setProjetoModo={setProjetoModo}
              estadoProjeto={estadoProjeto}
              setEstadoProjeto={(uf) => {
                setEstadoProjeto(uf);
                const cidadeDefault = cidadesPorEstado[uf][0]?.nome ?? 'Cidade';
                setCidadeProjeto(cidadeDefault);
                setProjetoSelecionado(
                  (projetoModo === 'ativos' ? projetosAtivos : projetosAntigos).find(
                    (p) => p.estado === uf && p.cidade === cidadeDefault,
                  ) ?? null,
                );
              }}
              cidadeProjeto={cidadeProjeto}
              setCidadeProjeto={(cidade) => {
                setCidadeProjeto(cidade);
                const listaBase = projetoModo === 'ativos' ? projetosAtivos : projetosAntigos;
                const prox = listaBase.find((p) => p.estado === estadoProjeto && p.cidade === cidade);
                setProjetoSelecionado(prox ?? null);
              }}
              projetosCidadeList={projetosCidadeList}
              projetoSelecionado={projetoSelecionado}
              setProjetoSelecionado={setProjetoSelecionado}
              parceriaSelecionada={parceriaSelecionada}
              setParceriaSelecionada={setParceriaSelecionada}
            />
          )}
          {activeTab === 'ia' && (
            <AgenteTab
              chatMessages={chatMessages}
              inputChat={inputChat}
              setInputChat={setInputChat}
              sendChat={sendChat}
              warningChat={warningChat}
              setWarningChat={setWarningChat}
            />
          )}
          {activeTab === 'config' && <ConfiguracoesTab />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ activeTab, onChange }: { activeTab: TabId; onChange: (id: TabId) => void }) {
  const tabs: { id: TabId; label: string; subtitle: string }[] = [
    { id: 'analise', label: 'Análise Geográfica', subtitle: 'Mapa e camadas' },
    { id: 'performance', label: 'Performance de Agentes', subtitle: 'Estados e KPIs' },
    { id: 'projetos', label: 'Projetos', subtitle: 'Primário / Incorporadoras' },
    { id: 'ia', label: 'Agente de IA', subtitle: 'UI demo' },
    { id: 'config', label: 'Configurações', subtitle: 'Preferências' },
  ];

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-[--border] bg-white px-5 py-6 shadow-soft">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[--muted] text-lg font-semibold text-[--foreground] shadow-soft">
          <span className="text-[--red]">M</span>
        </div>
        <div>
          <p className="text-lg font-semibold text-[--foreground]">Maestro</p>
          <p className="text-sm text-neutral-500">Painel Executivo</p>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
              activeTab === tab.id
                ? 'border-brand-gold bg-[--muted] text-[--foreground] shadow-soft'
                : 'border-transparent bg-white text-neutral-700 hover:border-[--border] hover:bg-neutral-50'
            }`}
          >
            <p className="font-semibold">{tab.label}</p>
            <p className="text-sm text-neutral-500">{tab.subtitle}</p>
          </button>
        ))}
      </nav>
      <div className="mt-6 rounded-xl border border-[--border] bg-[--muted] px-4 py-3 text-sm text-neutral-700">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[--red]">Modo Demo</span>
          <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-[--foreground]">Ativo</span>
        </div>
        <p className="mt-2 text-neutral-500">Dados simulados para apresentação da Lopes HQ.</p>
      </div>
    </aside>
  );
}

function AnaliseTab({
  mapLayers,
  setMapLayers,
  selectedAssistantKey,
}: {
  mapLayers: string[];
  setMapLayers: (ids: string[]) => void;
  selectedAssistantKey: string | null;
}) {
  const toggleLayer = (id: string) => {
    if (mapLayers.includes(id)) {
      setMapLayers(mapLayers.filter((i) => i !== id));
    } else {
      setMapLayers([...mapLayers, id]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[--foreground]">Análise Geográfica</h1>
          <span className="badge bg-[--muted] text-[--foreground]">Modo Demo: Dados Simulados</span>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">Mapa de São Paulo (Moema)</p>
                <p className="text-sm text-neutral-500">Camadas com hotspots simulados</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-neutral-600">
                {heatmapLayers.map((layer) => (
                  <div key={layer.id} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: layer.color, opacity: 0.85 }}
                    ></span>
                    <span>{layer.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[--border]">
              <LeafletMap center={[-23.603, -46.664]} zoom={13} layers={heatmapLayers} activeLayers={mapLayers} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {heatmapLayers.map((layer) => (
                <button
                  key={layer.id}
                  className={`btn-chip border-[--border] ${
                    mapLayers.includes(layer.id)
                      ? 'bg-[--muted] text-[--foreground] ring-1 ring-brand-gold'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                  onClick={() => toggleLayer(layer.id)}
                  title={layerDefinitions[layer.id]}
                >
                  <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: layer.color }}></span>
                  {layer.label}
                  <InfoIcon />
                </button>
              ))}
              <button
                className="btn-chip border-[--border] bg-white text-neutral-600 hover:bg-neutral-50"
                onClick={() => setMapLayers([])}
              >
                Limpar
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
              {Object.entries(layerDefinitions).map(([key, desc]) => (
                <div key={key} className="flex items-start gap-2">
                  <span
                    className="mt-1 h-3 w-3 rounded-full"
                    style={{ backgroundColor: heatmapLayers.find((h) => h.id === key)?.color }}
                  ></span>
                  <div>
                    <p className="font-medium text-[--foreground]">{heatmapLayers.find((h) => h.id === key)?.label}</p>
                    <p className="text-neutral-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="card h-full p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-[--foreground]">Assistente Operacional (Demo)</p>
                <p className="text-sm text-neutral-500">Selecione 1–2 camadas para ver uma interpretação operacional.</p>
              </div>
              <span className="badge bg-[--muted] text-[--foreground]">Determinístico</span>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-neutral-700">Camadas selecionadas</p>
                {mapLayers.length === 0 && <p className="text-sm text-neutral-500">Selecione uma ou duas camadas para receber um insight.</p>}
                {mapLayers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mapLayers.map((id) => (
                      <span key={id} className="badge bg-white text-[--foreground]">
                        {heatmapLayers.find((h) => h.id === id)?.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-dashed border-[--border] bg-[--muted] p-4 text-sm leading-6 text-neutral-700">
                {mapLayers.length === 0 && 'Nenhuma camada selecionada. Escolha até 2 camadas para receber um resumo operacional.'}
                {mapLayers.length >= 3 &&
                  'Nesta demo, o assistente explica até 2 camadas por vez. Reduza a seleção para continuar.'}
                {(mapLayers.length === 1 || mapLayers.length === 2) && selectedAssistantKey && (
                  <>{assistantTexts[selectedAssistantKey]}</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceTab({
  performanceModo,
  setPerformanceModo,
  estadoSelecionado,
  setEstadoSelecionado,
  cidadeSelecionada,
  setCidadeSelecionada,
  datasetAtivo,
  estadoData,
  cidadeData,
  cidadesDisponiveis,
}: {
  performanceModo: PerformanceModo;
  setPerformanceModo: (m: PerformanceModo) => void;
  estadoSelecionado: string;
  setEstadoSelecionado: (uf: string) => void;
  cidadeSelecionada: string;
  setCidadeSelecionada: (city: string) => void;
  datasetAtivo: PerformanceDataset;
  estadoData: StateMetrics;
  cidadeData: CityMetrics;
  cidadesDisponiveis: string[];
}) {
  const cards = [
    { id: 'lojas', title: 'Lojas Lopes', desc: 'Operação direta', action: () => setPerformanceModo('lojas') },
    { id: 'franquias', title: 'Franquias', desc: 'Rede parceira', action: () => setPerformanceModo('franquias') },
  ];

  const comparisonData = datasetAtivo.states.map((s) => ({ estado: s.uf, indice: s.indice }));

  const cidadeVsEstado = [
    { categoria: 'Índice de Performance', Cidade: cidadeData.indice, Mediana: estadoData.medianaIndice },
    { categoria: 'Conversão (%)', Cidade: cidadeData.conversao, Mediana: Math.max(10, cidadeData.conversao - 2) },
    { categoria: 'Negócios Fechados', Cidade: cidadeData.negocios, Mediana: Math.max(80, cidadeData.negocios - 40) },
  ];

  const cidadeVsNacional = [
    { categoria: 'Índice de Performance', Cidade: cidadeData.indice, Nacional: estadoData.medianaNacional },
    { categoria: 'Conversão (%)', Cidade: cidadeData.conversao, Nacional: 14 },
    { categoria: 'Volume (R$ mi)', Cidade: cidadeData.volume, Nacional: 28 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--foreground]">Performance de Agentes</h1>
          <p className="text-sm text-neutral-500">Selecione o modo e explore estados, cidades e KPIs.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={card.action}
            className={`card flex h-full items-center justify-between px-5 py-4 text-left transition ${
              performanceModo === card.id ? 'ring-1 ring-brand-gold bg-[--muted]' : 'bg-white'
            }`}
          >
            <div>
              <p className="text-lg font-semibold text-[--foreground]">{card.title}</p>
              <p className="text-sm text-neutral-500">{card.desc}</p>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                performanceModo === card.id ? 'bg-brand-gold text-white' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {performanceModo === card.id ? 'Selecionado' : 'Ver'}
            </div>
          </button>
        ))}
      </div>

      {performanceModo && (
        <div className="space-y-5">
          <div className="card p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-neutral-700">Estado</p>
                <select
                  value={estadoSelecionado}
                  onChange={(e) => setEstadoSelecionado(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[--border] bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-gold focus:outline-none"
                >
                  {availableStates.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-700">Cidades</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cidadesDisponiveis.map((cidade) => (
                    <button
                      key={cidade}
                      onClick={() => setCidadeSelecionada(cidade)}
                      className={`btn-chip border-[--border] ${
                        cidadeSelecionada === cidade
                          ? 'bg-[--muted] text-[--foreground] ring-1 ring-brand-gold'
                          : 'bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {cidade}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <div className="grid w-full grid-cols-2 gap-2 text-sm">
                  <KpiSmall label="Vendas Totais" value={`${estadoData.indice * 12} un.`} />
                  <KpiSmall label="Corretores Ativos" value={`${Math.round(estadoData.indice / 1.4)}`} />
                  <KpiSmall label="Invest. em Marketing" value={`R$ ${estadoData.marketingResumo.investimento} mi`} />
                  <KpiSmall label="Taxa de Conversão" value={`${(cidadeData.conversao ?? 0).toFixed(1)}%`} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-8 space-y-5">
              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-[--foreground]">Índice do Estado vs Outros Estados</p>
                  <span className="badge">Escala 0–100</span>
                </div>
                <div className="mt-3 h-64">
                  <ResizableResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                      <XAxis dataKey="estado" tickLine={false} />
                      <YAxis tickLine={false} domain={[50, 95]} />
                      <TooltipChart cursor={{ fill: '#f5f1e6' }} />
                      <Bar dataKey="indice" radius={[8, 8, 0, 0]} fill={palette.gold} />
                    </BarChart>
                  </ResizableResponsiveContainer>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-[--foreground]">Tendência do Estado (Últimos 12 Meses)</p>
                  <span className="badge">Negócios Fechados</span>
                </div>
                <div className="mt-3 h-64">
                  <ResizableResponsiveContainer width="100%" height="100%">
                    <LineChart data={estadoData.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                      <XAxis dataKey="mes" tickLine={false} />
                      <YAxis tickLine={false} domain={[40, 110]} />
                      <TooltipChart cursor={{ stroke: palette.gold }} />
                      <Line type="monotone" dataKey="valor" stroke={palette.gold} strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResizableResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="card p-5">
                  <p className="text-lg font-semibold text-[--foreground]">Cidade vs Mediana das Cidades do Estado</p>
                  <div className="mt-3 h-56">
                    <ResizableResponsiveContainer width="100%" height="100%">
                      <BarChart data={cidadeVsEstado} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                        <XAxis type="number" tickLine={false} />
                        <YAxis dataKey="categoria" type="category" width={160} tickLine={false} />
                        <Legend />
                        <TooltipChart />
                        <Bar dataKey="Cidade" fill={palette.gold} radius={[8, 8, 8, 8]} />
                        <Bar dataKey="Mediana" fill="#e5e7eb" radius={[8, 8, 8, 8]} />
                      </BarChart>
                    </ResizableResponsiveContainer>
                  </div>
                </div>
                <div className="card p-5">
                  <p className="text-lg font-semibold text-[--foreground]">Cidade vs Mediana Nacional (Cidades com Lopes)</p>
                  <div className="mt-3 h-56">
                    <ResizableResponsiveContainer width="100%" height="100%">
                      <BarChart data={cidadeVsNacional} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                        <XAxis type="number" tickLine={false} />
                        <YAxis dataKey="categoria" type="category" width={170} tickLine={false} />
                        <Legend />
                        <TooltipChart />
                        <Bar dataKey="Cidade" fill={palette.gold} radius={[8, 8, 8, 8]} />
                        <Bar dataKey="Nacional" fill={palette.red} radius={[8, 8, 8, 8]} opacity={0.6} />
                      </BarChart>
                    </ResizableResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <div className="card p-5">
                <p className="text-lg font-semibold text-[--foreground]">Top 5 Lojas (Melhor Performance)</p>
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {estadoData.lojasMelhores.map((loja) => (
                      <tr key={loja.loja} className="border-b border-[--border] last:border-0">
                        <td className="py-2 font-semibold text-neutral-800">{loja.loja}</td>
                        <td className="py-2 text-neutral-500">{loja.cidade}</td>
                        <td className="py-2 text-right font-semibold">{loja.indice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card p-5">
                <p className="text-lg font-semibold text-[--foreground]">Top 5 Lojas (Pior Performance)</p>
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {estadoData.lojasPiores.map((loja) => (
                      <tr key={loja.loja} className="border-b border-[--border] last:border-0">
                        <td className="py-2 font-semibold text-neutral-800">{loja.loja}</td>
                        <td className="py-2 text-neutral-500">{loja.cidade}</td>
                        <td className="py-2 text-right font-semibold">{loja.indice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card p-5 space-y-3">
                <p className="text-lg font-semibold text-[--foreground]">Eficiência de Marketing</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <KpiSmall label="Investimento" value={`R$ ${estadoData.marketingResumo.investimento} mi`} />
                  <KpiSmall label="Negócios Fechados" value={`${estadoData.marketingResumo.negocios}`} />
                  <KpiSmall label="CAC (proxy)" value={`R$ ${estadoData.marketingResumo.cac.toFixed(1)}k`} />
                  <KpiSmall label="ROI (proxy)" value={`${estadoData.marketingResumo.roi.toFixed(1)}%`} />
                </div>
              </div>
              <div className="card p-5 space-y-4">
                <p className="text-lg font-semibold text-[--foreground]">Receita: Primário vs Secundário</p>
                <div className="h-48">
                  <ResizableResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadoData.receitaSplit}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {estadoData.receitaSplit.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? palette.gold : '#f3f4f6'} />
                        ))}
                      </Pie>
                      <TooltipChart />
                    </PieChart>
                  </ResizableResponsiveContainer>
                </div>
                <p className="text-lg font-semibold text-[--foreground]">Receita por Canal</p>
                <div className="h-48">
                  <ResizableResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadoData.receitaCanais}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {estadoData.receitaCanais.map((entry, index) => (
                          <Cell
                            key={`cell-can-${index}`}
                            fill={[palette.gold, '#f2d58a', '#e5e7eb', palette.red][index % 4]}
                          />
                        ))}
                      </Pie>
                      <TooltipChart />
                      <Legend />
                    </PieChart>
                  </ResizableResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiSmall({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[--border] bg-white px-3 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-lg font-semibold text-[--foreground]">{value}</p>
    </div>
  );
}

function ProjetosTab({
  projetoModo,
  setProjetoModo,
  estadoProjeto,
  setEstadoProjeto,
  cidadeProjeto,
  setCidadeProjeto,
  projetosCidadeList,
  projetoSelecionado,
  setProjetoSelecionado,
  parceriaSelecionada,
  setParceriaSelecionada,
}: {
  projetoModo: ProjetoModo;
  setProjetoModo: (m: ProjetoModo) => void;
  estadoProjeto: string;
  setEstadoProjeto: (uf: string) => void;
  cidadeProjeto: string;
  setCidadeProjeto: (c: string) => void;
  projetosCidadeList: Project[];
  projetoSelecionado: Project | null;
  setProjetoSelecionado: (p: Project | null) => void;
  parceriaSelecionada: (typeof parceriasRank)[0];
  setParceriaSelecionada: (p: (typeof parceriasRank)[0]) => void;
}) {
  const cidadesAtivas = useMemo(() => cidadesPorEstado[estadoProjeto].map((c) => c.nome), [estadoProjeto]);

  const vgvEstado = availableStates.map((uf, idx) => ({ estado: uf, valor: 220 + idx * 20 }));
  const velocidadeVendas = tendenciaPadrao.map((p) => ({ mes: p.mes, valor: 12 + (p.valor % 7) }));
  const cidadeVsEstado = [
    { categoria: 'Índice de VGV (Primário)', Cidade: 78, Mediana: 68 },
    { categoria: 'Conversão', Cidade: 12.8, Mediana: 10.2 },
    { categoria: 'Velocidade (unid/mês)', Cidade: 16, Mediana: 12 },
  ];
  const cidadeVsNacional = [
    { categoria: 'Índice de VGV (Primário)', Cidade: 78, Nacional: 65 },
    { categoria: 'Conversão', Cidade: 12.8, Nacional: 10.4 },
    { categoria: 'Velocidade', Cidade: 16, Nacional: 11 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--foreground]">Projetos (Mercado Primário)</h1>
          <p className="text-sm text-neutral-500">Segmento de incorporadoras com dados simulados.</p>
        </div>
        <div className="inline-flex rounded-full border border-[--border] bg-white p-1 text-sm shadow-soft">
          <button
            className={`px-4 py-2 rounded-full ${projetoModo === 'ativos' ? 'bg-[--muted] font-semibold text-[--foreground] shadow-soft' : 'text-neutral-600'}`}
            onClick={() => setProjetoModo('ativos')}
          >
            Projetos Ativos
          </button>
          <button
            className={`px-4 py-2 rounded-full ${projetoModo === 'antigos' ? 'bg-[--muted] font-semibold text-[--foreground] shadow-soft' : 'text-neutral-600'}`}
            onClick={() => setProjetoModo('antigos')}
          >
            Projetos Antigos
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-neutral-700">Estado</p>
            <select
              value={estadoProjeto}
              onChange={(e) => setEstadoProjeto(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[--border] bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-gold focus:outline-none"
            >
              {availableStates.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-700">Cidades</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {cidadesAtivas.map((cidade) => (
                <button
                  key={cidade}
                  onClick={() => setCidadeProjeto(cidade)}
                  className={`btn-chip border-[--border] ${
                    cidadeProjeto === cidade
                      ? 'bg-[--muted] text-[--foreground] ring-1 ring-brand-gold'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {cidade}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end justify-end text-sm text-neutral-500">
            <div className="text-right">
              <p className="font-semibold text-neutral-800">Corte: Mercado Primário</p>
              <p>VGV, velocidade e ROI simulados por estado/cidade.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="card p-5">
            <p className="text-lg font-semibold text-[--foreground]">Índice de VGV (Primário) por Estado</p>
            <div className="mt-3 h-64">
              <ResizableResponsiveContainer width="100%" height="100%">
                <BarChart data={vgvEstado}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                  <XAxis dataKey="estado" tickLine={false} />
                  <YAxis tickLine={false} />
                  <TooltipChart />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]} fill={palette.gold} />
                </BarChart>
              </ResizableResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-lg font-semibold text-[--foreground]">Velocidade de Vendas (Últimos 12 Meses)</p>
            <div className="mt-3 h-64">
              <ResizableResponsiveContainer width="100%" height="100%">
                <LineChart data={velocidadeVendas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                  <XAxis dataKey="mes" tickLine={false} />
                  <YAxis tickLine={false} />
                  <TooltipChart />
                  <Line type="monotone" dataKey="valor" stroke={palette.gold} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResizableResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="card p-5">
              <p className="text-lg font-semibold text-[--foreground]">Cidade vs Mediana do Estado</p>
              <div className="mt-3 h-56">
                <ResizableResponsiveContainer width="100%" height="100%">
                  <BarChart data={cidadeVsEstado} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                    <XAxis type="number" tickLine={false} />
                    <YAxis dataKey="categoria" type="category" width={170} tickLine={false} />
                    <Legend />
                    <TooltipChart />
                    <Bar dataKey="Cidade" fill={palette.gold} radius={[8, 8, 8, 8]} />
                    <Bar dataKey="Mediana" fill="#e5e7eb" radius={[8, 8, 8, 8]} />
                  </BarChart>
                </ResizableResponsiveContainer>
              </div>
            </div>
            <div className="card p-5">
              <p className="text-lg font-semibold text-[--foreground]">Cidade vs Mediana Nacional</p>
              <div className="mt-3 h-56">
                <ResizableResponsiveContainer width="100%" height="100%">
                  <BarChart data={cidadeVsNacional} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                    <XAxis type="number" tickLine={false} />
                    <YAxis dataKey="categoria" type="category" width={150} tickLine={false} />
                    <Legend />
                    <TooltipChart />
                    <Bar dataKey="Cidade" fill={palette.gold} radius={[8, 8, 8, 8]} />
                    <Bar dataKey="Nacional" fill={palette.red} radius={[8, 8, 8, 8]} opacity={0.6} />
                  </BarChart>
                </ResizableResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-[--foreground]">Projetos na Cidade</p>
              <span className="badge">{projetoModo === 'ativos' ? 'Ativos' : 'Histórico'}</span>
            </div>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {projetosCidadeList.map((projeto) => (
                <button
                  key={projeto.id}
                  onClick={() => setProjetoSelecionado(projeto)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    projetoSelecionado?.id === projeto.id
                      ? 'border-brand-gold bg-[--muted] shadow-soft'
                      : 'border-[--border] bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-[--foreground]">{projeto.nome}</p>
                      <p className="text-neutral-500">{projeto.incorporadora}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold">{projeto.vendido}%</p>
                      <span className="rounded-full bg-white px-2 py-1 text-[--red]">{projeto.status}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {projetoSelecionado && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-[--foreground]">{projetoSelecionado.nome}</p>
                  <p className="text-sm text-neutral-500">{projetoSelecionado.incorporadora} · {projetoSelecionado.cidade}</p>
                </div>
                <span className="rounded-full bg-brand-gold px-3 py-1 text-xs font-semibold text-white">{projetoSelecionado.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <KpiSmall label="Unidades" value={`${projetoSelecionado.unidades}`} />
                <KpiSmall label="% Vendido" value={`${projetoSelecionado.vendido}%`} />
                <KpiSmall label="VGV Esperado" value={`R$ ${projetoSelecionado.financeiro.vgvEsperado} mi`} />
                <KpiSmall label="VGV Real" value={`R$ ${projetoSelecionado.financeiro.vgvRealizado} mi`} />
              </div>
              <div className="rounded-xl border border-[--border] bg-[--muted] px-4 py-3 text-sm">
                <p className="font-semibold text-neutral-800">Split Lojas vs Franquias</p>
                <p className="mt-1">Lojas Lopes: {projetoSelecionado.lojasVsFranquias.lojas}% · Franquias: {projetoSelecionado.lojasVsFranquias.franquias}%</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-sm font-semibold text-neutral-700">Financeiro</p>
                  <ul className="mt-2 space-y-1 text-neutral-600">
                    <li>Custo total: R$ {projetoSelecionado.financeiro.custoTotal} mi</li>
                    <li>Preço médio: {projetoSelecionado.financeiro.precoMedio}</li>
                    <li>ROI esperado vs real: {projetoSelecionado.financeiro.roiEsperado}% / {projetoSelecionado.financeiro.roiReal}%</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-700">Inventário</p>
                  <ul className="mt-2 space-y-1 text-neutral-600">
                    <li>Total: {projetoSelecionado.inventario.total}</li>
                    <li>Vendidas: {projetoSelecionado.inventario.vendidas} · Restantes: {projetoSelecionado.inventario.restantes}</li>
                    <li>Velocidade: {projetoSelecionado.inventario.velocidade}</li>
                    <li>Conversão / Cancelamento: {projetoSelecionado.inventario.conversao} / {projetoSelecionado.inventario.cancelamento}</li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-sm font-semibold text-neutral-700">Funnel</p>
                  <ul className="mt-2 space-y-1 text-neutral-600">
                    <li>Leads (30d): {projetoSelecionado.funnel.leads}</li>
                    <li>Visitas agendadas/realizadas: {projetoSelecionado.funnel.agendadas} / {projetoSelecionado.funnel.realizadas}</li>
                    <li>Propostas: {projetoSelecionado.funnel.propostas}</li>
                    <li>Contratos: {projetoSelecionado.funnel.contratos}</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-700">Timeline</p>
                  <ul className="mt-2 space-y-1 text-neutral-600">
                    <li>Lançamento: {projetoSelecionado.timeline.lancamento}</li>
                    <li>Entrega: {projetoSelecionado.timeline.entrega}</li>
                    <li>Semanas no mercado: {projetoSelecionado.timeline.semanasNoMercado}</li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="h-56">
                  <ResizableResponsiveContainer width="100%" height="100%">
                    <LineChart data={projetoSelecionado.vendidosAoTempo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                      <XAxis dataKey="mes" tickLine={false} />
                      <YAxis tickLine={false} />
                      <TooltipChart />
                      <Line type="monotone" dataKey="unidades" stroke={palette.gold} strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResizableResponsiveContainer>
                </div>
                <div className="h-56">
                  <ResizableResponsiveContainer width="100%" height="100%">
                    <BarChart data={projetoSelecionado.roiComparativo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                      <XAxis dataKey="nome" tickLine={false} />
                      <YAxis tickLine={false} />
                      <TooltipChart />
                      <Bar dataKey="valor" radius={[8, 8, 0, 0]} fill={palette.gold} />
                    </BarChart>
                  </ResizableResponsiveContainer>
                </div>
              </div>
              {projetoModo === 'antigos' && projetoSelecionado.insights && (
                <div className="rounded-xl border border-[--border] bg-white px-4 py-3 text-sm text-neutral-700">
                  <p className="font-semibold text-[--foreground]">Insights pós-mortem</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {projetoSelecionado.insights.map((insight) => (
                      <li key={insight}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {projetoModo === 'antigos' && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-[--foreground]">Parcerias Mais Lucrativas</p>
                <span className="badge">Ranking Top 8</span>
              </div>
              <div className="space-y-2">
                {parceriasRank.map((parceiro) => (
                  <button
                    key={parceiro.nome}
                    onClick={() => setParceriaSelecionada(parceiro)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      parceriaSelecionada?.nome === parceiro.nome
                        ? 'border-brand-gold bg-[--muted] shadow-soft'
                        : 'border-[--border] bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-[--foreground]">{parceiro.nome}</p>
                        <p className="text-neutral-500">{parceiro.projetos} projetos · ROI médio {parceiro.roiMedio}%</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[--red]">{parceiro.destaque}</span>
                    </div>
                  </button>
                ))}
              </div>
              {parceriaSelecionada && (
                <div className="rounded-xl border border-[--border] bg-white p-4 text-sm text-neutral-700">
                  <p className="font-semibold text-[--foreground]">{parceriaSelecionada.nome}</p>
                  <p className="mt-1">Projetos concluídos: {parceriaSelecionada.projetos} · Unidades: {parceriaSelecionada.unidades}</p>
                  <p className="mt-1">VGV: R$ {parceriaSelecionada.vgv} mi · ROI médio: {parceriaSelecionada.roiMedio}%</p>
                  <p className="mt-1">Tempo médio para vender: {parceriaSelecionada.tempoMedio} semanas</p>
                  <p className="mt-1">Melhor cidade/estado: {parceriaSelecionada.destaque}</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="h-44">
                      <ResizableResponsiveContainer width="100%" height="100%">
                        <BarChart data={parceriaSelecionada.roiPorProjeto.map((v, idx) => ({ projeto: `P${idx + 1}`, valor: v }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                          <XAxis dataKey="projeto" tickLine={false} />
                          <YAxis tickLine={false} />
                          <TooltipChart />
                          <Bar dataKey="valor" radius={[8, 8, 0, 0]} fill={palette.gold} />
                        </BarChart>
                      </ResizableResponsiveContainer>
                    </div>
                    <div className="h-44">
                      <ResizableResponsiveContainer width="100%" height="100%">
                        <LineChart data={parceriaSelecionada.tempoPorProjeto.map((v, idx) => ({ projeto: `P${idx + 1}`, valor: v }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1eadb" />
                          <XAxis dataKey="projeto" tickLine={false} />
                          <YAxis tickLine={false} />
                          <TooltipChart />
                          <Line type="monotone" dataKey="valor" stroke={palette.red} strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResizableResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgenteTab({
  chatMessages,
  inputChat,
  setInputChat,
  sendChat,
  warningChat,
  setWarningChat,
}: {
  chatMessages: Mensagem[];
  inputChat: string;
  setInputChat: (v: string) => void;
  sendChat: () => void;
  warningChat: string;
  setWarningChat: (v: string) => void;
}) {
  const exemplos = [
    'Quais cidades estão com melhor ROI no primário?',
    'Onde a demanda está alta e a cobertura baixa?',
    'Qual incorporadora tem melhor histórico?',
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--foreground]">Agente Maestro (Demo)</h1>
          <p className="text-sm text-neutral-500">Interface de chat sem conexão real aos dados.</p>
        </div>
        <span className="badge bg-white text-[--red]">Sem Conexão (UI apenas)</span>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card p-4 text-sm text-neutral-700">
          <p className="font-semibold text-[--foreground]">Contexto disponível</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Análise Geográfica (heatmaps)</li>
            <li>Performance de Agentes (estados, cidades, KPIs)</li>
            <li>Projetos (primário: ativos/antigos, incorporadoras, ROI, VGV)</li>
          </ul>
        </div>
        <div className="card p-4 lg:col-span-2">
          <div className="flex flex-wrap gap-2 text-sm">
            {exemplos.map((ex) => (
              <button
                key={ex}
                onClick={() => setInputChat(ex)}
                className="rounded-full border border-[--border] bg-white px-3 py-2 text-neutral-700 hover:bg-[--muted]"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`w-fit max-w-[80%] rounded-xl px-4 py-3 text-sm shadow-sm ${
                  msg.remetente === 'assistente'
                    ? 'bg-[--muted] text-[--foreground]'
                    : 'ml-auto bg-brand-gold text-white'
                }`}
              >
                {msg.texto}
              </div>
            ))}
            {warningChat && (
              <div className="w-fit max-w-[80%] rounded-xl bg-white px-4 py-3 text-sm text-[--red] shadow-sm ring-1 ring-[--red]">
                {warningChat}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <input
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              placeholder="Digite sua pergunta..."
              className="flex-1 rounded-xl border border-[--border] bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-gold focus:outline-none"
            />
            <button
              onClick={() => {
                setWarningChat('');
                sendChat();
              }}
              className="rounded-xl bg-brand-gold px-5 py-3 text-sm font-semibold text-white shadow-soft hover:brightness-105"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfiguracoesTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--foreground]">Configurações</h1>
          <p className="text-sm text-neutral-500">Preferências de exibição do modo demo.</p>
        </div>
        <span className="badge">Tema Branco / Dourado / Vermelho</span>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="card p-5 space-y-3">
          <p className="text-lg font-semibold text-[--foreground]">Visual do Tema</p>
          <div className="flex gap-3">
            <div className="h-16 w-16 rounded-xl border border-[--border] bg-white shadow-sm"></div>
            <div className="h-16 w-16 rounded-xl border border-[--border] bg-brand-gold shadow-sm"></div>
            <div className="h-16 w-16 rounded-xl border border-[--border] bg-brand-red shadow-sm"></div>
          </div>
          <p className="text-sm text-neutral-600">Paleta limpa com destaque em dourado e alertas em vermelho profundo.</p>
        </div>
        <div className="card p-5 space-y-3">
          <p className="text-lg font-semibold text-[--foreground]">Preferências</p>
          <div className="space-y-2 text-sm text-neutral-700">
            <div className="flex items-center justify-between rounded-xl border border-[--border] bg-white px-3 py-3">
              <span>Modo Demo</span>
              <span className="rounded-full bg-[--muted] px-3 py-1 text-xs font-semibold text-neutral-700">Sempre ativo</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[--border] bg-white px-3 py-3">
              <span>Preferência de moeda</span>
              <span className="font-semibold text-neutral-800">BRL</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[--border] bg-white px-3 py-3">
              <span>Formato de data</span>
              <span className="font-semibold text-neutral-800">dd/mm/aaaa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="h-4 w-4 text-neutral-500"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default Page;
