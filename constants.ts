
import { Plan, Contract, User } from './types';

export const PIX_KEY = "22981442400";

export const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 29.90,
    period: '/mês',
    features: ['5 Contratos/mês', 'Armazenamento básico', 'Suporte por e-mail']
  },
  {
    id: 'quarterly',
    name: 'Trimestral',
    price: 39.90,
    period: '/trimestre',
    features: ['20 Contratos/mês', 'Certificado Digital Avançado', 'Prioridade na fila', 'Economia de 55%'],
    recommended: true
  },
  {
    id: 'annual',
    name: 'Anual',
    price: 89.90,
    period: '/ano',
    features: ['Contratos Ilimitados', 'API de Integração', 'Gestor de Conta', 'White Label']
  }
];

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Carlos Mendes',
  email: 'carlos@exemplo.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
  role: 'client',
  plan: null,
  isVerified: true
};

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'c1',
    title: 'Contrato de Prestação de Serviços - TI',
    content: 'Este contrato firma o acordo entre as partes para desenvolvimento de software...',
    type: 'text',
    status: 'completed',
    createdBy: 'u1',
    createdAt: new Date('2023-10-15'),
    location: 'São Paulo, SP',
    hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    signers: [
      { id: 'u1', name: 'Carlos Mendes', email: 'carlos@exemplo.com', role: 'sender', status: 'signed', signedAt: new Date('2023-10-15T10:00:00') },
      { id: 's2', name: 'Tech Solutions Ltda', email: 'contato@techsolutions.com', role: 'signer', status: 'signed', signedAt: new Date('2023-10-16T14:30:00') }
    ]
  },
  {
    id: 'c2',
    title: 'Acordo de Confidencialidade (NDA)',
    content: 'As partes concordam em manter sigilo sobre as informações trocadas durante...',
    type: 'pdf',
    fileUrl: '#',
    status: 'pending',
    createdBy: 'u1',
    createdAt: new Date('2023-10-20'),
    location: 'Rio de Janeiro, RJ',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    signers: [
      { id: 'u1', name: 'Carlos Mendes', email: 'carlos@exemplo.com', role: 'sender', status: 'signed', signedAt: new Date('2023-10-20T09:00:00') },
      { id: 's3', name: 'Investidor Anjo', email: 'investidor@vc.com', role: 'signer', status: 'pending' }
    ]
  }
];