import { useState } from 'react';
import {
  Cloud,
  GitBranch,
  Webhook,
  Zap,
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  configured: boolean;
  lastSync: string | null;
  fields: { key: string; label: string; type: string; placeholder: string }[];
}

const integrations: Integration[] = [
  {
    id: 'azure-devops',
    name: 'Azure DevOps',
    description: 'Sync test cases and results with Azure DevOps boards and pipelines.',
    icon: Cloud,
    color: 'bg-blue-100 text-blue-600',
    configured: false,
    lastSync: null,
    fields: [
      { key: 'organization', label: 'Organization', type: 'text', placeholder: 'my-org' },
      { key: 'project', label: 'Project', type: 'text', placeholder: 'my-project' },
      { key: 'pat', label: 'Personal Access Token', type: 'password', placeholder: 'Enter PAT' },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect Salesforce for CRM-driven test management workflows.',
    icon: Zap,
    color: 'bg-cyan-100 text-cyan-600',
    configured: false,
    lastSync: null,
    fields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'text', placeholder: 'https://myorg.salesforce.com' },
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter client secret' },
    ],
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    description: 'Trigger test runs from Jenkins pipelines and report results back.',
    icon: Webhook,
    color: 'bg-red-100 text-red-600',
    configured: false,
    lastSync: null,
    fields: [
      { key: 'url', label: 'Jenkins URL', type: 'text', placeholder: 'https://jenkins.example.com' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'admin' },
      { key: 'token', label: 'API Token', type: 'password', placeholder: 'Enter API token' },
    ],
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    description: 'Integrate with GitHub Actions for CI/CD test automation.',
    icon: GitBranch,
    color: 'bg-slate-100 text-slate-700',
    configured: false,
    lastSync: null,
    fields: [
      { key: 'repo', label: 'Repository', type: 'text', placeholder: 'owner/repo' },
      { key: 'token', label: 'GitHub Token', type: 'password', placeholder: 'ghp_...' },
    ],
  },
];

export default function IntegrationPage() {
  const [configModal, setConfigModal] = useState<Integration | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const openConfig = (integration: Integration) => {
    setConfigModal(integration);
    setFormValues({});
    setConnectionStatus('idle');
  };

  const handleTestConnection = () => {
    setTesting(true);
    setConnectionStatus('idle');
    setTimeout(() => {
      setTesting(false);
      // Simulate: success for demo
      setConnectionStatus('success');
      toast.success('Connection test successful');
    }, 1500);
  };

  const handleSave = () => {
    toast.success(`${configModal?.name} configuration saved`);
    setConfigModal(null);
  };

  const handleSync = (name: string) => {
    toast.success(`Syncing ${name}...`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Integrations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect third-party tools to enhance your workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-5"
          >
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${integration.color}`}>
                <integration.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">{integration.name}</h3>
                  {integration.configured && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{integration.description}</p>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => openConfig(integration)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configure
                  </button>
                  {integration.configured && (
                    <button
                      onClick={() => handleSync(integration.name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Sync Now
                    </button>
                  )}
                </div>

                {integration.lastSync && (
                  <p className="text-[11px] text-slate-400 mt-2">
                    Last synced: {integration.lastSync}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Configure Modal */}
      <Modal
        isOpen={!!configModal}
        onClose={() => setConfigModal(null)}
        title={`Configure ${configModal?.name ?? ''}`}
        size="md"
      >
        {configModal && (
          <div className="space-y-4">
            {configModal.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={formValues[field.key] ?? ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}

            {connectionStatus === 'success' && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                <CheckCircle2 className="h-4 w-4" />
                Connection successful
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-xs">
                <XCircle className="h-4 w-4" />
                Connection failed. Check your credentials.
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfigModal(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
