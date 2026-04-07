'use client'

import { useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Star,
  Download,
} from 'lucide-react'
import { updateBrief, deleteBrief } from '@/actions/briefs'
import { createTask, updateTask, deleteTask } from '@/actions/production'
import { uploadCreativeFile, deleteFile, markFileAsFinal } from '@/actions/files'
import {
  BRIEF_STATUS_LABELS,
  BRIEF_STATUS_COLORS,
  BRIEF_STATUSES,
  TASK_TYPE_LABELS,
  TASK_TYPES,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_COLORS,
} from '@/types/production'
import type {
  BriefStatus,
  TaskStatus,
  TaskType,
  Priority,
} from '@/types/production'

type BriefDetailProps = {
  brief: Record<string, unknown> & {
    id: string
    title: string
    status: string
    channel_type: string
    objective?: string
    target_audience?: string
    key_messages?: string
    due_date?: string
    brand_guidelines_url?: string
    campaigns?: { id: string; name: string }
    production_tasks?: { id: string; title: string; task_type: string; status: string; priority: string; profiles?: { full_name: string } | null }[]
    creative_files?: { id: string; file_name: string; file_url: string; file_type: string | null; file_size: number | null; version: number; is_final: boolean; notes: string | null }[]
  }
  orgMembers: { user_id: string; profiles: { full_name: string } }[]
}

export function BriefDetailClient({ brief, orgMembers }: BriefDetailProps) {
  const router = useRouter()
  const [showAddTask, setShowAddTask] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  // Status change
  async function handleStatusChange(newStatus: string) {
    const fd = new FormData()
    fd.set('id', brief.id)
    fd.set('status', newStatus)
    await updateBrief(fd)
    router.refresh()
  }

  // Delete brief
  async function handleDelete() {
    if (!confirm('Delete this brief and all its tasks/files?')) return
    await deleteBrief(brief.id)
    router.push('/dashboard/briefs')
  }

  // Add task
  const taskInitial = { error: null as Record<string, string[]> | null }
  async function handleCreateTask(
    _prev: typeof taskInitial,
    formData: FormData
  ) {
    formData.set('brief_id', brief.id)
    const result = await createTask(formData)
    if ('error' in result && result.error) {
      return { error: result.error as Record<string, string[]> }
    }
    setShowAddTask(false)
    router.refresh()
    return { error: null }
  }
  const [taskState, taskAction, taskPending] = useActionState(
    handleCreateTask,
    taskInitial
  )

  // Task status update
  async function handleTaskStatusChange(taskId: string, status: string) {
    const fd = new FormData()
    fd.set('id', taskId)
    fd.set('status', status)
    await updateTask(fd)
    router.refresh()
  }

  // Delete task
  async function handleDeleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return
    await deleteTask(taskId)
    router.refresh()
  }

  // File upload
  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('brief_id', brief.id)
    await uploadCreativeFile(fd)
    setShowUpload(false)
    router.refresh()
  }

  // Mark file as final
  async function handleMarkFinal(fileId: string) {
    await markFileAsFinal(fileId)
    router.refresh()
  }

  // Delete file
  async function handleDeleteFile(fileId: string) {
    if (!confirm('Delete this file?')) return
    await deleteFile(fileId)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/briefs"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Briefs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{brief.title}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
            <span className="capitalize">
              {brief.channel_type.replace(/_/g, ' ')}
            </span>
            {brief.campaigns?.name && (
              <>
                <span>·</span>
                <Link
                  href={`/dashboard/campaigns/${brief.campaigns.id}`}
                  className="text-emerald-600 hover:underline"
                >
                  {brief.campaigns.name}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Selector */}
          <select
            value={brief.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide border-0 cursor-pointer ${
              BRIEF_STATUS_COLORS[brief.status as BriefStatus] ??
              'bg-zinc-100 text-zinc-600'
            }`}
          >
            {BRIEF_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BRIEF_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            onClick={handleDelete}
            className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Brief Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {brief.objective && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2">
              Objective
            </h3>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {brief.objective}
            </p>
          </div>
        )}
        {brief.target_audience && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2">
              Target Audience
            </h3>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {brief.target_audience}
            </p>
          </div>
        )}
        {brief.key_messages && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2">
              Key Messages
            </h3>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {brief.key_messages}
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2">
            Details
          </h3>
          <div className="space-y-1.5 text-sm text-zinc-600">
            {brief.due_date && (
              <p>
                <span className="text-zinc-400">Due: </span>
                {new Date(brief.due_date).toLocaleDateString()}
              </p>
            )}
            {brief.brand_guidelines_url && (
              <p>
                <span className="text-zinc-400">Brand Guidelines: </span>
                <a
                  href={brief.brand_guidelines_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  View
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Production Tasks */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900">
            Tasks ({brief.production_tasks?.length ?? 0})
          </h2>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <form
            action={taskAction}
            className="border-b border-zinc-100 p-5 bg-zinc-50 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Task Title *
                </label>
                <input
                  name="title"
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Design homepage banner"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Type *
                </label>
                <select
                  name="task_type"
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TASK_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Assign To
                </label>
                <select
                  name="assigned_to"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Unassigned</option>
                  {orgMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profiles.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue="medium"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {PRIORITY_LEVELS.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                placeholder="Task details..."
              />
            </div>
            {taskState.error?._form && (
              <p className="text-xs text-red-600">{taskState.error._form[0]}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={taskPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {taskPending ? 'Adding...' : 'Add Task'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        {brief.production_tasks?.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            No tasks yet. Add tasks to track production progress.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {brief.production_tasks?.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-zinc-900 truncate">
                      {task.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                      {TASK_TYPE_LABELS[task.task_type as TaskType]}
                    </span>
                    <span
                      className={`shrink-0 text-xs font-bold ${
                        PRIORITY_COLORS[task.priority as Priority]
                      }`}
                    >
                      {PRIORITY_LABELS[task.priority as Priority]}
                    </span>
                  </div>
                  {task.profiles?.full_name && (
                    <p className="text-xs text-zinc-400">
                      {task.profiles.full_name}
                    </p>
                  )}
                </div>
                <select
                  value={task.status}
                  onChange={(e) =>
                    handleTaskStatusChange(task.id, e.target.value)
                  }
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border-0 cursor-pointer ${
                    TASK_STATUS_COLORS[task.status as TaskStatus] ??
                    'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {(['todo', 'in_progress', 'review', 'done', 'blocked'] as const).map(
                    (s) => (
                      <option key={s} value={s}>
                        {TASK_STATUS_LABELS[s]}
                      </option>
                    )
                  )}
                </select>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="rounded p-1 text-zinc-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creative Files */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900">
            Files ({brief.creative_files?.length ?? 0})
          </h2>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload File
          </button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <form
            onSubmit={handleUpload}
            className="border-b border-zinc-100 p-5 bg-zinc-50 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                File *
              </label>
              <input
                name="file"
                type="file"
                required
                className="w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Notes
              </label>
              <input
                name="notes"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Version notes..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* File List */}
        {brief.creative_files?.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            No files uploaded yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {brief.creative_files?.map((file) => (
              <div key={file.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900 truncate">
                      {file.file_name}
                    </span>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                      v{file.version}
                    </span>
                    {file.is_final && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {file.file_size
                      ? `${(file.file_size / 1024).toFixed(0)} KB`
                      : ''}
                    {file.notes && ` · ${file.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1.5 text-zinc-400 hover:text-emerald-600 transition-colors"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {!file.is_final && (
                    <button
                      onClick={() => handleMarkFinal(file.id)}
                      className="rounded p-1.5 text-zinc-400 hover:text-amber-500 transition-colors"
                      title="Mark as Final"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="rounded p-1.5 text-zinc-300 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
