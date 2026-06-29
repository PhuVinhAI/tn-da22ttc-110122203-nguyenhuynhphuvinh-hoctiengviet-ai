import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../presentation/screen_ui_snapshot.dart';

class CurrentScreenUiSnapshotNotifier extends Notifier<Map<String, dynamic>> {
  String _signature = '{}';

  @override
  Map<String, dynamic> build() => const {};

  void update(Map<String, dynamic> snapshot) {
    final nextSignature = jsonEncode(snapshot);
    if (nextSignature == _signature) return;
    _signature = nextSignature;
    state = snapshot;
  }

  void clear() {
    update(const {});
  }
}

final currentScreenUiSnapshotProvider =
    NotifierProvider<CurrentScreenUiSnapshotNotifier, Map<String, dynamic>>(
      CurrentScreenUiSnapshotNotifier.new,
    );

class ScreenUiSnapshotCoordinator {
  GlobalKey<ScreenUiSnapshotHostState>? _hostKey;

  void attach(GlobalKey<ScreenUiSnapshotHostState> hostKey) {
    _hostKey = hostKey;
  }

  void detach(GlobalKey<ScreenUiSnapshotHostState> hostKey) {
    if (_hostKey == hostKey) {
      _hostKey = null;
    }
  }

  ScreenUiSnapshot? captureNow() {
    return _hostKey?.currentState?.captureNow();
  }
}

final screenUiSnapshotCoordinatorProvider =
    Provider<ScreenUiSnapshotCoordinator>((ref) {
      return ScreenUiSnapshotCoordinator();
    });
