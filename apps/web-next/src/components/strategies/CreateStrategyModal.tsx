import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreateStrategyPayload } from '@/hooks/useStrategies';
import { Input, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateStrategyModalProps {
  onSubmit: (data: CreateStrategyPayload) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const strategyTypeOptions = [
  { value: 'manual', label: 'Manuel' },
  { value: 'automated', label: 'Otomatik' },
];

const riskLevelOptions = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
];

export const CreateStrategyModal: React.FC<CreateStrategyModalProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateStrategyPayload>({
    defaultValues: {
      name: '',
      description: '',
      type: 'manual',
      riskLevel: 'medium',
    },
  });

  const handleFormSubmit = async (data: CreateStrategyPayload) => {
    setError(null);
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Strateji oluşturulamadı');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Yeni Strateji Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <Input
              label="Strateji Adı"
              placeholder="Strateji adını girin"
              error={errors.name?.message}
              required
              {...register('name', {
                required: 'Strateji adı gereklidir',
                minLength: {
                  value: 3,
                  message: 'En az 3 karakter olmalıdır',
                },
              })}
            />

            <Textarea
              label="Açıklama"
              placeholder="Strateji açıklaması (opsiyonel)"
              rows={3}
              {...register('description')}
            />

            <Select
              label="Strateji Tipi"
              options={strategyTypeOptions}
              error={errors.type?.message}
              required
              {...register('type', {
                required: 'Strateji tipi seçilmelidir',
              })}
            />

            <Select
              label="Risk Seviyesi"
              options={riskLevelOptions}
              error={errors.riskLevel?.message}
              required
              {...register('riskLevel', {
                required: 'Risk seviyesi seçilmelidir',
              })}
            />

            {error && (
              <div className="text-red-400 text-sm bg-red-950/20 border border-red-800 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Oluşturuluyor...' : 'Oluştur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
