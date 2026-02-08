/**
 * Command Templates - Copilot command templates for different scopes
 */

export type CommandTemplate = {
  id: string;
  label: string;
  prompt: string;
  scope: string[]; // ['all', 'dashboard', 'market-data', 'strategy-lab', 'running', 'strategies']
  requiresContext?: string[]; // Optional context fields required
  icon?: string;
};

export const COMMAND_TEMPLATES: CommandTemplate[] = [
  {
    id: 'analyze-portfolio-risk',
    label: 'Portföy riskini analiz et',
    prompt: 'Portföy riskini analiz et ve öneriler sun',
    scope: ['all', 'dashboard'],
    requiresContext: ['portfolio'],
  },
  {
    id: 'summarize-running-strategies',
    label: 'Çalışan stratejileri özetle',
    prompt: 'Çalışan stratejileri özetle ve performans metriklerini göster',
    scope: ['all', 'running', 'strategies'],
    requiresContext: ['strategies'],
  },
  {
    id: 'trade-suggestion-today',
    label: 'Bugün için işlem önerisi',
    prompt: 'Bugün için işlem önerisi sun',
    scope: ['all', 'market-data', 'dashboard'],
    requiresContext: ['market'],
  },
  {
    id: 'market-analysis',
    label: 'Piyasa analizi',
    prompt: 'Mevcut piyasa durumunu analiz et',
    scope: ['all', 'market-data'],
    requiresContext: ['market'],
  },
  {
    id: 'strategy-optimization',
    label: 'Strateji optimizasyonu',
    prompt: 'Strateji optimizasyonu için öneriler sun',
    scope: ['all', 'strategy-lab', 'strategies'],
    requiresContext: ['strategies'],
  },
];

export function getTemplatesForScope(scope: string): CommandTemplate[] {
  return COMMAND_TEMPLATES.filter(
    template => template.scope.includes(scope) || template.scope.includes('all')
  );
}
