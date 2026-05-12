import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/continue_card.dart';
import '../../data/home_providers.dart';
import '../../../courses/data/courses_providers.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _refreshOnFocus();
  }

  void _refreshOnFocus() {
    ref.invalidate(continueLearningProvider);
  }

  Future<void> _onRefresh() async {
    ref.invalidate(continueLearningProvider);
    ref.invalidate(userProgressProvider);
    await ref.read(continueLearningProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: const [
            ContinueCard(),
          ],
        ),
      ),
    );
  }
}
