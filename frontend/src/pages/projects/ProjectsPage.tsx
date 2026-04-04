import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, FolderKanban } from 'lucide-react';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useProjectStore } from '@/store/projectStore';
import Modal from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { formatDate } from '@/utils/helpers';
import type { ProjectResponse } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name is required (min 2 chars)'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, dashes only'),
  description: z.string().optional(),
  prefix: z.string().min(1, 'Prefix is required').max(5, 'Max 5 characters').regex(/^[A-Z]+$/, 'Uppercase letters only'),
});

type FormData = z.infer<typeof schema>;

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const nameValue = watch('name');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue('name', v);
    const slug = v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setValue('slug', slug);
  };

  const onSubmit = (formData: FormData) => {
    createProject.mutate(
      {
        name: formData.name,
        slug: formData.slug,
        description: formData.description ?? '',
        prefix: formData.prefix,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          reset();
        },
      },
    );
  };

  const openProject = (project: ProjectResponse) => {
    setActiveProject(project);
    navigate(`/projects/${project.id}/dashboard`);
  };

  if (isLoading) return <LoadingSpinner label="Loading projects..." />;
  if (error) return <p className="text-red-600 text-sm">Failed to load projects.</p>;

  const projects = data?.content ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your test management projects
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start managing test cases."
          action={{ label: 'Create Project', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => openProject(project)}
              className="text-left bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-brand-300 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="h-5 w-5 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {project.prefix} &middot; {project.slug}
                  </p>
                </div>
              </div>
              {project.description && (
                <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                  {project.description}
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-3">
                Created {formatDate(project.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title="Create Project"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Project Name
            </label>
            <input
              {...register('name')}
              onChange={handleNameChange}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="My Project"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slug
            </label>
            <input
              {...register('slug')}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="my-project"
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prefix (e.g. TC, PRJ)
            </label>
            <input
              {...register('prefix')}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
              placeholder="TC"
              maxLength={5}
            />
            {errors.prefix && (
              <p className="mt-1 text-xs text-red-600">{errors.prefix.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                reset();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
