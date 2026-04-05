import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTestCase, useUpdateTestCase } from '@/hooks/useTestCases';
import { tagApi } from '@/api/tagApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { Priority, TestCaseStatus, AutomationStatus } from '@/types';

const stepSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  expectedResult: z.string().optional(),
  testData: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  objective: z.string().optional(),
  preconditions: z.string().optional(),
  postconditions: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['DRAFT', 'READY', 'ARCHIVED', 'DEPRECATED']),
  automationStatus: z.enum(['NOT_AUTOMATED', 'AUTOMATION_CANDIDATE', 'AUTOMATED', 'AUTOMATION_BROKEN']),
  tagIds: z.array(z.string()),
  steps: z.array(stepSchema),
});

type FormData = z.infer<typeof schema>;

export default function EditTestCasePage() {
  const { projectId, testCaseId } = useParams<{ projectId: string; testCaseId: string }>();
  const navigate = useNavigate();
  const { data: tc, isLoading, error } = useTestCase(projectId, testCaseId);
  const updateMutation = useUpdateTestCase(projectId!);

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', projectId],
    queryFn: () => tagApi.list(projectId!),
    enabled: !!projectId,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'DRAFT',
      automationStatus: 'NOT_AUTOMATED',
      tagIds: [],
      steps: [{ action: '', expectedResult: '', testData: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'steps' });

  // Pre-fill form once test case data loads
  useEffect(() => {
    if (!tc) return;
    reset({
      title: tc.title,
      description: tc.description ?? '',
      objective: tc.objective ?? '',
      preconditions: tc.preconditions ?? '',
      postconditions: tc.postconditions ?? '',
      priority: tc.priority,
      status: tc.status,
      automationStatus: tc.automationStatus,
      tagIds: tc.tags.map((t) => t.id),
      steps:
        tc.steps.length > 0
          ? [...tc.steps]
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((s) => ({
                action: s.action,
                expectedResult: s.expectedResult ?? '',
                testData: s.testData ?? '',
              }))
          : [{ action: '', expectedResult: '', testData: '' }],
    });
  }, [tc, reset]);

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(
      {
        id: testCaseId!,
        data: {
          title: data.title,
          description: data.description ?? '',
          objective: data.objective ?? '',
          preconditions: data.preconditions ?? '',
          postconditions: data.postconditions ?? '',
          priority: data.priority as Priority,
          status: data.status as TestCaseStatus,
          automationStatus: data.automationStatus as AutomationStatus,
          tagIds: data.tagIds,
          steps: data.steps.map((s, i) => ({
            stepNumber: i + 1,
            action: s.action,
            expectedResult: s.expectedResult ?? '',
            testData: s.testData ?? '',
          })),
        },
      },
      {
        onSuccess: () => navigate(`/projects/${projectId}/test-cases/${testCaseId}`),
      },
    );
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  if (isLoading) return <LoadingSpinner label="Loading test case..." />;
  if (error || !tc) return <p className="text-red-600 text-sm">Failed to load test case.</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Edit Test Case</h1>
        <span className="font-mono text-sm text-slate-400">{tc.testCaseKey}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Basic Information</h2>

          <div>
            <label className={labelClass}>Title *</label>
            <input {...register('title')} className={inputClass} placeholder="Test case title" />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea {...register('description')} rows={3} className={inputClass} placeholder="Describe the test case" />
          </div>

          <div>
            <label className={labelClass}>Objective</label>
            <textarea {...register('objective')} rows={2} className={inputClass} placeholder="What does this test verify?" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Preconditions</label>
              <textarea {...register('preconditions')} rows={2} className={inputClass} placeholder="Setup requirements" />
            </div>
            <div>
              <label className={labelClass}>Postconditions</label>
              <textarea {...register('postconditions')} rows={2} className={inputClass} placeholder="Expected state after test" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Priority</label>
              <select {...register('priority')} className={inputClass}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select {...register('status')} className={inputClass}>
                <option value="DRAFT">Draft</option>
                <option value="READY">Ready</option>
                <option value="ARCHIVED">Archived</option>
                <option value="DEPRECATED">Deprecated</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Automation Status</label>
              <select {...register('automationStatus')} className={inputClass}>
                <option value="NOT_AUTOMATED">Not Automated</option>
                <option value="AUTOMATED">Automated</option>
                <option value="AUTOMATION_CANDIDATE">Automation Candidate</option>
                <option value="AUTOMATION_BROKEN">Automation Broken</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className={labelClass}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      value={tag.id}
                      {...register('tagIds')}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Test Steps</h2>
            <button
              type="button"
              onClick={() => append({ action: '', expectedResult: '', testData: '' })}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Step
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-start pt-2 text-slate-400">
                  <span className="text-xs font-bold w-6 text-center">{index + 1}</span>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Action *</label>
                    <textarea
                      {...register(`steps.${index}.action`)}
                      rows={2}
                      className={inputClass}
                      placeholder="Describe the action"
                    />
                    {errors.steps?.[index]?.action && (
                      <p className="mt-1 text-xs text-red-600">{errors.steps[index]?.action?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Expected Result</label>
                    <textarea
                      {...register(`steps.${index}.expectedResult`)}
                      rows={2}
                      className={inputClass}
                      placeholder="What should happen?"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Test Data</label>
                    <textarea
                      {...register(`steps.${index}.testData`)}
                      rows={2}
                      className={inputClass}
                      placeholder="Input data (optional)"
                    />
                  </div>
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="self-start p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
