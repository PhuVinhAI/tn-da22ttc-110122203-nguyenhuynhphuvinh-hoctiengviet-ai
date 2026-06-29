import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Transient UI state owned by `ExerciseHubScreen`: in-flight exercise generation,
/// per-exercise busy spinners, and the last failed-action error banner. Lifted to
/// Riverpod so `exerciseHubScreenContextBuilder` can expose what the learner
/// actually sees (a spinning button, a red error toast) to the assistant.
@immutable
class ExerciseHubViewState {
  const ExerciseHubViewState({
    this.isCreatingCustom = false,
    this.busyExerciseId,
    this.busyAction,
    this.actionError,
  });

  final bool isCreatingCustom;
  final String? busyExerciseId;

  /// One of `regenerate`, `delete`, `reset`, `create`.
  final String? busyAction;

  /// The current inline error banner text, if any.
  final String? actionError;

  ExerciseHubViewState copyWith({
    bool? isCreatingCustom,
    String? busyExerciseId,
    String? busyAction,
    String? actionError,
  }) {
    return ExerciseHubViewState(
      isCreatingCustom: isCreatingCustom ?? this.isCreatingCustom,
      busyExerciseId: busyExerciseId ?? this.busyExerciseId,
      busyAction: busyAction ?? this.busyAction,
      actionError: actionError ?? this.actionError,
    );
  }

  ExerciseHubViewState clearBusy() {
    return ExerciseHubViewState(
      isCreatingCustom: false,
      busyExerciseId: null,
      busyAction: null,
      actionError: actionError,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ExerciseHubViewState &&
          isCreatingCustom == other.isCreatingCustom &&
          busyExerciseId == other.busyExerciseId &&
          busyAction == other.busyAction &&
          actionError == other.actionError;

  @override
  int get hashCode =>
      Object.hash(isCreatingCustom, busyExerciseId, busyAction, actionError);
}

class ExerciseHubViewStateNotifier extends Notifier<ExerciseHubViewState> {
  @override
  ExerciseHubViewState build() => const ExerciseHubViewState();

  void set(ExerciseHubViewState next) {
    if (state == next) return;
    state = next;
  }

  void clear() {
    if (state == const ExerciseHubViewState()) return;
    state = const ExerciseHubViewState();
  }
}

final exerciseHubViewStateProvider = NotifierProvider<
    ExerciseHubViewStateNotifier, ExerciseHubViewState>(
  ExerciseHubViewStateNotifier.new,
);
