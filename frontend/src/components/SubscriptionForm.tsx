import { useState, FormEvent } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import type { SubscriptionCreate } from '../api/types';

interface SubscriptionFormProps {
  onSubmit: (data: SubscriptionCreate) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<SubscriptionCreate>;
  submitLabel?: string;
}

export default function SubscriptionForm({
  onSubmit,
  onCancel,
  initialData,
  submitLabel = 'Add Subscription',
}: SubscriptionFormProps) {
  const [formData, setFormData] = useState<SubscriptionCreate>({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    currency: initialData?.currency || 'USD',
    billing_cycle: initialData?.billing_cycle || 'monthly',
    next_billing_date: initialData?.next_billing_date || null,
    category: initialData?.category || null,
    is_active: initialData?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }
    if (formData.price <= 0) {
      setErrors({ price: 'Price must be greater than 0' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{submitLabel}</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <Input
            label="Subscription Name *"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
            placeholder="e.g., Netflix, Spotify"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price *"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              error={errors.price}
              required
            />

            <Input
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
              placeholder="USD"
              maxLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Cycle *
            </label>
            <select
              name="billing_cycle"
              value={formData.billing_cycle}
              onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              required
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <Input
            label="Next Billing Date"
            name="next_billing_date"
            type="date"
            value={formData.next_billing_date || ''}
            onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value || null })}
          />

          <Input
            label="Category"
            name="category"
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
            placeholder="e.g., Entertainment, Music, Software"
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active subscription
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

