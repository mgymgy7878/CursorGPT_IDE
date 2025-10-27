'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Card, Grid, Metric, Text, Badge, ProgressBar, Title } from '@tremor/react';
import { Download, RefreshCw, FileText, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const fetcher = (url: string) => fetch(url).then(r => r.json());

type ExportJob = {
  id: string;
  type: 'report' | 'data' | 'backup';
  format: 'csv' | 'pdf';
  size: number;
  sizeKb?: number;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  downloadUrl?: string;
  error?: string;
};

export default function ExportPage() {
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  
  const { data, error, isLoading, mutate } = useSWR<{ jobs: ExportJob[]; stats: any }>(
    '/api/export/jobs',
    fetcher,
    { 
      refreshInterval: pollingEnabled ? 5000 : 0,
      fallbackData: { jobs: [], stats: {} }
    }
  );
  
  const jobs = data?.jobs || [];
  const stats = data?.stats || { running: 0, queued: 0, done: 0, failed: 0, total24h: 0 };
  
  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesFormat = formatFilter === 'all' || job.format === formatFilter;
    return matchesSearch && matchesStatus && matchesFormat;
  });
  
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; text: string }> = {
      running: { color: 'blue', icon: RefreshCw, text: 'Çalışıyor' },
      queued: { color: 'yellow', icon: Clock, text: 'Kuyrukta' },
      done: { color: 'green', icon: CheckCircle, text: 'Tamamlandı' },
      failed: { color: 'red', icon: XCircle, text: 'Başarısız' }
    };
    const badge = badges[status] || badges.done;
    const Icon = badge.icon;
    return (
      <Badge color={badge.color as any} icon={Icon}>
        {badge.text}
      </Badge>
    );
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };
  
  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}dk`;
  };
  
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Export Dashboard</h1>
          <p className="text-gray-600 mt-2">CSV/PDF Export İşlemleri</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPollingEnabled(!pollingEnabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              pollingEnabled 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {pollingEnabled ? '⏸️ Polling (5s)' : '▶️ Polling Kapalı'}
          </button>
          <button
            onClick={() => mutate()}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            title="Yenile"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <Grid numItemsMd={2} numItemsLg={5} className="gap-4">
        <Card decoration="left" decorationColor="blue">
          <Text>Çalışıyor</Text>
          <Metric className="mt-2">{stats.running}</Metric>
        </Card>
        <Card decoration="left" decorationColor="yellow">
          <Text>Kuyrukta</Text>
          <Metric className="mt-2">{stats.queued}</Metric>
        </Card>
        <Card decoration="left" decorationColor="green">
          <Text>Tamamlandı</Text>
          <Metric className="mt-2">{stats.done}</Metric>
        </Card>
        <Card decoration="left" decorationColor="red">
          <Text>Başarısız</Text>
          <Metric className="mt-2">{stats.failed}</Metric>
        </Card>
        <Card decoration="left" decorationColor="gray">
          <Text>Son 24 Saat</Text>
          <Metric className="mt-2">{stats.total24h}</Metric>
        </Card>
      </Grid>
      
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="İşlem ID veya tip ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="running">Çalışıyor</option>
              <option value="queued">Kuyrukta</option>
              <option value="done">Tamamlandı</option>
              <option value="failed">Başarısız</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Formatlar</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>
      </Card>
      
      {/* Jobs Table */}
      <Card>
        <Title className="mb-4">Export İşlemleri ({filteredJobs.length})</Title>
        
        {isLoading && jobs.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Henüz export işlemi yok</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchTerm || statusFilter !== 'all' || formatFilter !== 'all'
                ? 'Filtrelerinizi değiştirmeyi deneyin'
                : 'İlk export işleminizi başlatın'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-gray-800">
                        {job.id}
                      </span>
                      <Badge size="sm" color="gray">
                        {job.type}
                      </Badge>
                      <Badge size="sm" color={job.format === 'csv' ? 'blue' : 'purple'}>
                        {job.format.toUpperCase()}
                      </Badge>
                      {getStatusBadge(job.status)}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Boyut:</span>
                        <span className="ml-2 font-medium">
                          {formatBytes(job.sizeKb ? job.sizeKb * 1024 : job.size)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Süre:</span>
                        <span className="ml-2 font-medium">
                          {formatDuration(job.durationMs)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Başlangıç:</span>
                        <span className="ml-2 font-medium">
                          {formatDistanceToNow(new Date(job.startedAt), { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </span>
                      </div>
                      {job.finishedAt && (
                        <div>
                          <span className="text-gray-600">Bitiş:</span>
                          <span className="ml-2 font-medium">
                            {formatDistanceToNow(new Date(job.finishedAt), { 
                              addSuffix: true, 
                              locale: tr 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {job.status === 'running' && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">İlerleme</span>
                          <span className="text-xs font-semibold text-blue-600">
                            {job.progress}%
                          </span>
                        </div>
                        <ProgressBar value={job.progress} color="blue" />
                      </div>
                    )}
                    
                    {job.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        {job.error}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {job.status === 'done' && job.downloadUrl && (
                      <a
                        href={job.downloadUrl}
                        download
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        İndir
                      </a>
                    )}
                    {job.status === 'done' && !job.downloadUrl && (
                      <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm">
                        Dosya bulunamadı
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Veriler yüklenirken hata oluştu: {error.message}
        </div>
      )}
      
      {/* Footer */}
      <Text className="text-xs text-gray-500 text-center">
        Son güncelleme: {new Date().toLocaleTimeString('tr-TR')} | 
        Polling: {pollingEnabled ? '✅ Aktif (5s)' : '❌ Kapalı'}
      </Text>
    </div>
  );
}

