import { useEffect, useState } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  Plus, Pencil, Users, MoreVertical, Trash2,
  Clock, Sparkles, MessageCircle, Target, Quote,
  Save, X, Copy, Check,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PublishStatusToggle } from '../../components/admin/PublishStatusToggle'
import { ScenarioDetailSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import { SystemPromptEditor } from '../../components/admin/editors/SystemPromptEditor'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useAdminScenario, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import type { ScenarioCharacter } from '../../features/simulations/types'
import { simulationPath } from './route-utils'

const levelMeta: Record<string, string> = {
  A1: 'bg-emerald-500',
  A2: 'bg-teal-500',
  B1: 'bg-blue-500',
  B2: 'bg-indigo-500',
  C1: 'bg-purple-500',
  C2: 'bg-rose-500',
}

const difficultyMeta: Record<string, { label: string; bg: string; color: string }> = {
  EASY: { label: 'Dễ', bg: 'bg-emerald-100 dark:bg-emerald-950/40', color: 'text-emerald-700 dark:text-emerald-300' },
  MEDIUM: { label: 'Trung bình', bg: 'bg-amber-100 dark:bg-amber-950/40', color: 'text-amber-700 dark:text-amber-300' },
  HARD: { label: 'Khó', bg: 'bg-rose-100 dark:bg-rose-950/40', color: 'text-rose-700 dark:text-rose-300' },
}

export function ScenarioDetailPage() {
  const { scenarioId } = useParams()
  const navigate = useNavigate()
  const { data: scenario, isLoading, error, refetch, isFetching } = useAdminScenario(scenarioId)
  const mutations = useSimulationsAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<ScenarioCharacter | null>(null)

  const characters = scenario?.characters ?? []
  const [editingAi, setEditingAi] = useState(false)
  const [draftSystemPrompt, setDraftSystemPrompt] = useState('')
  const [draftOpeningMessage, setDraftOpeningMessage] = useState('')

  useEffect(() => {
    if (!editingAi && scenario) {
      setDraftSystemPrompt(scenario.systemPrompt ?? '')
      setDraftOpeningMessage(scenario.openingMessage ?? '')
    }
  }, [scenario, editingAi])

  const startEditAi = () => {
    setDraftSystemPrompt(scenario?.systemPrompt ?? '')
    setDraftOpeningMessage(scenario?.openingMessage ?? '')
    setEditingAi(true)
  }

  const cancelEditAi = () => setEditingAi(false)

  const saveAi = async () => {
    if (!scenarioId) return
    try {
      await mutations.updateScenario.mutateAsync({
        id: scenarioId,
        payload: {
          systemPrompt: draftSystemPrompt,
          openingMessage: draftOpeningMessage || null,
        },
      })
      toast.success('Đã cập nhật cấu hình AI')
      setEditingAi(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteCharacter.mutateAsync(pendingDelete.id)
      toast.success('Đã xóa nhân vật')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  const togglePublished = async (next: boolean) => {
    if (!scenarioId) return
    try {
      await mutations.setScenarioPublished.mutateAsync({ id: scenarioId, isPublished: next })
      toast.success(next ? 'Đã xuất bản tình huống' : 'Đã chuyển về bản nháp')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái')
    }
  }

  const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation()

  const playableCount = scenario?.characters?.filter((c) => c.isPlayable).length ?? 0
  const scoringCriteria = Array.isArray(scenario?.scoringCriteria) ? scenario.scoringCriteria : []
  const totalWeight = scoringCriteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
  const weightBalanced = totalWeight === 100
  const levelBg = levelMeta[scenario?.requiredLevel ?? ''] ?? 'bg-muted'
  const diff = difficultyMeta[scenario?.difficulty ?? ''] ?? {
    label: scenario?.difficulty ?? '—',
    bg: 'bg-muted',
    color: 'text-muted-foreground',
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: scenario?.category?.name ?? 'Danh mục', href: scenario?.categoryId ? simulationPath.category(scenario.categoryId) : undefined },
          { label: scenario?.title ?? 'Tình huống' },
        ]}
      />

      {/* Header card */}
      <div className="rounded-xl border-2 border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-white font-bold ${levelBg}`}
              >
                {scenario?.requiredLevel ?? '—'}
              </span>
              <span className={`inline-flex items-center rounded-md px-2 py-1 font-bold ${diff.bg} ${diff.color}`}>
                {diff.label}
              </span>
              {scenario?.estimatedMinutes && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium tabular-nums">{scenario.estimatedMinutes} phút</span>
                </span>
              )}
              {scenario?.maxTurns && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  <span className="font-medium tabular-nums">tối đa {scenario.maxTurns} lượt</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {scenario?.title ?? 'Tình huống'}
            </h1>
            {scenario?.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
                {scenario.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {scenario && (
              <PublishStatusToggle
                isPublished={scenario.isPublished}
                onChange={togglePublished}
                pending={mutations.setScenarioPublished.isPending}
              />
            )}
            {scenarioId && scenario && (
              <Button asChild variant="outline">
                <Link to={simulationPath.scenarioEdit(scenario.categoryId, scenarioId)}>
                  <Pencil className="h-4 w-4" />
                  Sửa
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <ScenarioDetailSkeleton />
      ) : error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : scenario ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — AI configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI configuration — system prompt + opening message */}
            <section className="rounded-xl border-2 border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">Cấu hình AI</h2>
                    <p className="text-[11px] text-muted-foreground">
                      Lời nhắc hệ thống và tin nhắn mở đầu
                    </p>
                  </div>
                </div>
                {editingAi ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={cancelEditAi}
                      disabled={mutations.updateScenario.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveAi}
                      disabled={mutations.updateScenario.isPending}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Lưu
                    </Button>
                  </div>
                ) : (
                  <Button type="button" size="sm" variant="ghost" onClick={startEditAi}>
                    <Pencil className="h-3.5 w-3.5" />
                    Sửa
                  </Button>
                )}
              </div>

              <div className="divide-y-2 divide-border">
                {/* System prompt sub-section */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Lời nhắc hệ thống cho AI
                      </h3>
                    </div>
                    <CopyButton
                      value={editingAi ? draftSystemPrompt : scenario.systemPrompt ?? ''}
                      label="Sao chép lời nhắc"
                    />
                  </div>
                  {editingAi ? (
                    <SystemPromptEditor
                      value={draftSystemPrompt}
                      onChange={setDraftSystemPrompt}
                      characters={scenario.characters}
                      placeholder={`VD:\nBạn đóng vai {{characters[0].name}} ({{characters[0].role}}), nói chuyện với học viên đóng vai {{playable.name}}, trình độ {{learner.level}}, ngôn ngữ mẹ đẻ {{learner.nativeLanguage}}.\n\nBối cảnh: {{scenario.title}} — {{scenario.description}}`}
                    />
                  ) : scenario.systemPrompt ? (
                    <SystemPromptEditor
                      value={scenario.systemPrompt}
                      characters={scenario.characters}
                      readOnly
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Chưa thiết lập. Bấm <span className="font-semibold not-italic">Sửa</span> để cấu hình.
                    </p>
                  )}
                </div>

                {/* Opening message sub-section */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Quote className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tin nhắn mở đầu của AI
                    </h3>
                  </div>
                  {editingAi ? (
                    <>
                      <Textarea
                        value={draftOpeningMessage}
                        onChange={(e) => setDraftOpeningMessage(e.target.value)}
                        placeholder="VD: Xin chào, anh/chị muốn dùng gì ạ?"
                        className="min-h-20"
                      />
                      <p className="text-xs text-muted-foreground">
                        Câu chào AI nói trước. Để trống nếu không cần.
                      </p>
                    </>
                  ) : scenario.openingMessage ? (
                    <div className="rounded-lg border-2 border-border bg-muted/30 p-3">
                      <p className="text-sm text-foreground italic leading-relaxed">
                        &quot;{scenario.openingMessage}&quot;
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Chưa có tin nhắn mở đầu.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Scoring criteria */}
            <section className="rounded-xl border-2 border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Target className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold tracking-tight">Tiêu chí chấm điểm</h2>
                </div>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    weightBalanced
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive'
                  }`}
                >
                  {scoringCriteria.length} tiêu chí · tổng {totalWeight}%
                </span>
              </div>

              {scoringCriteria.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Chưa có tiêu chí chấm điểm nào
                </div>
              ) : (
                <div className="divide-y-2 divide-border">
                  {scoringCriteria.map((criterion, i) => {
                    const weight = Number(criterion.weight) || 0
                    return (
                      <div key={i} className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-700 dark:text-amber-400">
                              {i + 1}
                            </span>
                            <h3 className="text-sm font-bold text-foreground">{criterion.name}</h3>
                          </div>
                          <span className="text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400 shrink-0">
                            {weight}%
                          </span>
                        </div>
                        {criterion.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                            {criterion.description}
                          </p>
                        )}
                        <div className="mt-2 ml-8 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${Math.min(100, weight)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right column — Characters */}
          <div className="space-y-6">
            <section className="rounded-xl border-2 border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold tracking-tight">Dàn nhân vật</h2>
                </div>
                {scenarioId && (
                  <Button asChild size="sm">
                    <Link to={simulationPath.characterNew(scenarioId)}>
                      <Plus className="h-3.5 w-3.5" />
                      Thêm
                    </Link>
                  </Button>
                )}
              </div>

              <div className="p-4">
                {!scenario.characters || scenario.characters.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
                    <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                    <h3 className="text-sm font-bold mb-1">Chưa có nhân vật</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Thêm nhân vật để AI nhập vai
                    </p>
                    {scenarioId && (
                      <Button asChild size="sm">
                        <Link to={simulationPath.characterNew(scenarioId)}>
                          <Plus className="h-3.5 w-3.5" />
                          Tạo nhân vật
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-md bg-muted/50 px-2.5 py-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Tổng
                        </span>
                        <span className="ml-1 text-sm font-bold tabular-nums">
                          {scenario.characters.length}
                        </span>
                      </div>
                      <div className="rounded-md bg-primary/10 px-2.5 py-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          Học viên chơi
                        </span>
                        <span className="ml-1 text-sm font-bold tabular-nums text-primary">
                          {playableCount}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {characters.map((character) => (
                        <CharacterCard
                          key={character.id}
                          character={character}
                          onEdit={() =>
                            navigate(simulationPath.characterEdit(character.scenarioId, character.id))
                          }
                          onDelete={() => setPendingDelete(character)}
                          stop={stop}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Xóa nhân vật?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Nhân vật <span className="font-semibold text-foreground">&quot;{pendingDelete?.name}&quot;</span> và toàn bộ đoạn hội thoại có nhân vật này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4" />
              Xóa nhân vật
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const disabled = !value.trim()

  const onCopy = async () => {
    if (disabled) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Đã sao chép')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Không thể sao chép')
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={onCopy}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="h-7 px-2 text-[11px]"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Đã chép' : 'Sao chép'}
    </Button>
  )
}

function CharacterCard({
  character,
  onEdit,
  onDelete,
  stop,
}: {
  character: ScenarioCharacter
  onEdit: () => void
  onDelete: () => void
  stop: (e: MouseEvent | KeyboardEvent) => void
}) {
  const initial = character.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEdit()
      }}
      className="group rounded-lg border-2 border-border bg-card p-3 cursor-pointer transition-colors hover:border-primary focus:outline-none focus:border-primary"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{character.name}</h3>
              {character.isPlayable && (
                <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary shrink-0">
                  Học viên chơi
                </span>
              )}
            </div>
            <div onClick={stop} onKeyDown={stop} className="shrink-0 -mr-1 -mt-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={onEdit}>
                    <Pencil className="h-4 w-4" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 className="h-4 w-4" />
                    Xóa nhân vật
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate">{character.role}</p>
          {character.personality && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1.5 leading-relaxed">
              {character.personality}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
