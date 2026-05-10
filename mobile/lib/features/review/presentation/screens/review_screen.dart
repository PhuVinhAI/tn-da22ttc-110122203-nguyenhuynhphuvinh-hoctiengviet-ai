import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/review_providers.dart';
import '../../domain/review_models.dart';
import '../../domain/review_engine.dart';
import '../widgets/flashcard_widget.dart';
import '../widgets/rating_buttons.dart';
import '../widgets/session_summary_widget.dart';
import '../services/audio_player_service.dart';

enum ReviewState {
  loading,
  ready,
  reviewing,
  submitting,
  completed,
  empty,
  error,
}

class ReviewScreen extends ConsumerStatefulWidget {
  const ReviewScreen({super.key});

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  ReviewState _state = ReviewState.loading;
  List<DueReviewItem> _items = [];
  int _currentIndex = 0;
  bool _isFlipped = false;
  List<Rating> _ratings = [];
  DateTime? _sessionStartTime;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDueItems();
  }

  Future<void> _loadDueItems() async {
    try {
      setState(() => _state = ReviewState.loading);
      final repo = ref.read(vocabularyRepositoryProvider);
      final items = await repo.getDueForReview();
      setState(() {
        _items = items;
        _state = items.isEmpty ? ReviewState.empty : ReviewState.ready;
        _sessionStartTime = DateTime.now();
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _state = ReviewState.error;
      });
    }
  }

  void _startReview() {
    setState(() {
      _state = ReviewState.reviewing;
      _currentIndex = 0;
      _isFlipped = false;
      _ratings = [];
      _sessionStartTime = DateTime.now();
    });
  }

  void _onFlip() {
    setState(() => _isFlipped = true);
  }

  Future<void> _onRating(Rating rating) async {
    setState(() => _state = ReviewState.submitting);

    try {
      final item = _items[_currentIndex];
      final repo = ref.read(reviewRepositoryProvider);

      await repo.submitReview(
        vocabularyId: item.vocabulary.id,
        rating: rating,
      );

      _ratings.add(rating);

      if (_currentIndex < _items.length - 1) {
        setState(() {
          _currentIndex++;
          _isFlipped = false;
          _state = ReviewState.reviewing;
        });
      } else {
        setState(() => _state = ReviewState.completed);
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _state = ReviewState.error;
      });
    }
  }

  void _onFinish() {
    ref.invalidate(dueReviewCountProvider);
    context.go('/');
  }

  Future<void> _playAudio() async {
    final audioUrl = _items[_currentIndex].vocabulary.audioUrl;
    if (audioUrl != null) {
      final audioService = ref.read(audioPlayerProvider);
      await audioService.play(audioUrl);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Review'),
        actions: [
          if (_state == ReviewState.reviewing)
            Center(
              child: Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Text(
                  '${_currentIndex + 1}/${_items.length}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    switch (_state) {
      case ReviewState.loading:
        return const Center(child: CircularProgressIndicator());

      case ReviewState.ready:
        return _buildReadyState();

      case ReviewState.reviewing:
      case ReviewState.submitting:
        return _buildReviewingState();

      case ReviewState.completed:
        return _buildCompletedState();

      case ReviewState.empty:
        return _buildEmptyState();

      case ReviewState.error:
        return _buildErrorState();
    }
  }

  Widget _buildReadyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.school,
            size: 64,
            color: Theme.of(context).primaryColor,
          ),
          const SizedBox(height: 16),
          Text(
            '${_items.length} items due for review',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Keep your vocabulary fresh!',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _startReview,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: 48,
                vertical: 16,
              ),
            ),
            child: const Text('Start Review'),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewingState() {
    final item = _items[_currentIndex];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Expanded(
            child: FlashcardWidget(
              vocabulary: item.vocabulary,
              onFlip: _onFlip,
              onAudioPlay: _playAudio,
            ),
          ),
          const SizedBox(height: 24),
          if (_isFlipped)
            RatingButtons(
              onRating: _onRating,
              enabled: _state == ReviewState.reviewing,
            )
          else
            Text(
              'Tap the card to reveal the answer',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          const SizedBox(height: 16),
          _buildMasteryIndicator(item.masteryLevel),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 64,
            color: Colors.green,
          ),
          const SizedBox(height: 16),
          Text(
            'All caught up!',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'No vocabulary due for review right now.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Come back later or learn new words!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[500],
                ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => context.go('/'),
            child: const Text('Back to Home'),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletedState() {
    final duration = _sessionStartTime != null
        ? DateTime.now().difference(_sessionStartTime!)
        : Duration.zero;

    final summary = ReviewEngine.calculateSessionSummary(
      _ratings,
      duration,
    );

    return SingleChildScrollView(
      child: SessionSummaryWidget(
        summary: summary,
        onFinish: _onFinish,
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 16),
          Text(
            _error ?? 'An error occurred',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadDueItems,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildMasteryIndicator(MasteryLevel level) {
    Color color;
    String text;

    switch (level) {
      case MasteryLevel.newWord:
        color = Colors.grey;
        text = 'New';
      case MasteryLevel.learning:
        color = Colors.orange;
        text = 'Learning';
      case MasteryLevel.familiar:
        color = Colors.blue;
        text = 'Familiar';
      case MasteryLevel.mastered:
        color = Colors.green;
        text = 'Mastered';
    }

    return Chip(
      label: Text(
        text,
        style: TextStyle(color: color, fontWeight: FontWeight.bold),
      ),
      backgroundColor: color.withOpacity(0.1),
      side: BorderSide(color: color),
    );
  }
}
