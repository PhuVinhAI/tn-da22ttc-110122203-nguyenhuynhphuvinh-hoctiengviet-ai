import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/sync/sync.dart';
import '../data/image_analysis_providers.dart';
import '../domain/image_analysis_models.dart';

const _unsetError = Object();
const maxImageDiscoveryImages = 5;

final imagePickerProvider = Provider<ImagePicker>((ref) => ImagePicker());

final imageDiscoveryProvider =
    NotifierProvider<ImageDiscoveryNotifier, ImageDiscoveryState>(
      ImageDiscoveryNotifier.new,
    );

class ImageDiscoveryImage {
  const ImageDiscoveryImage({
    required this.id,
    required this.bytes,
    required this.base64,
    required this.mimeType,
  });

  final String id;
  final Uint8List bytes;
  final String base64;
  final String mimeType;

  ImageAnalysisRequestImage toRequestImage() {
    return ImageAnalysisRequestImage(base64: base64, mimeType: mimeType);
  }
}

enum ImageDiscoveryMessageRole { user, assistant }

class ImageDiscoveryMessage {
  const ImageDiscoveryMessage({
    required this.id,
    required this.role,
    required this.text,
    this.vocabularies = const [],
  });

  final String id;
  final ImageDiscoveryMessageRole role;
  final String text;
  final List<ImageAnalysisVocabulary> vocabularies;

  bool get isUser => role == ImageDiscoveryMessageRole.user;

  ImageAnalysisChatHistoryMessage toChatHistoryMessage() {
    return ImageAnalysisChatHistoryMessage(
      role: isUser ? 'user' : 'assistant',
      content: text,
    );
  }
}

class ImageDiscoveryState {
  const ImageDiscoveryState({
    this.images = const [],
    this.messages = const [],
    this.isLoading = false,
    this.error,
    this.failedOutboundContent,
  });

  final List<ImageDiscoveryImage> images;
  final List<ImageDiscoveryMessage> messages;
  final bool isLoading;
  final ImageDiscoveryError? error;
  final String? failedOutboundContent;

  bool get hasImage => images.isNotEmpty;
  bool get canAddImages => images.length < maxImageDiscoveryImages;

  ImageDiscoveryState copyWith({
    List<ImageDiscoveryImage>? images,
    List<ImageDiscoveryMessage>? messages,
    bool? isLoading,
    Object? error = _unsetError,
    Object? failedOutboundContent = _unsetError,
  }) {
    return ImageDiscoveryState(
      images: images ?? this.images,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: identical(error, _unsetError) ? this.error : error as ImageDiscoveryError?,
      failedOutboundContent: identical(failedOutboundContent, _unsetError)
          ? this.failedOutboundContent
          : failedOutboundContent as String?,
    );
  }
}

class ImageDiscoveryNotifier extends Notifier<ImageDiscoveryState> {
  int _session = 0;
  CancelToken? _cancelToken;
  String? _pendingPrompt;

  @override
  ImageDiscoveryState build() => const ImageDiscoveryState();

  void reset() {
    _session += 1;
    _cancelToken?.cancel('reset');
    _cancelToken = null;
    _pendingPrompt = null;
    state = const ImageDiscoveryState();
  }

  void cancelAnalysis() {
    if (!state.isLoading) return;
    final prompt = _pendingPrompt;
    _session += 1;
    _cancelToken?.cancel('user stopped');
    _cancelToken = null;
    _pendingPrompt = null;
    state = state.copyWith(
      messages: state.messages.isEmpty
          ? state.messages
          : state.messages.sublist(0, state.messages.length - 1),
      isLoading: false,
      error: null,
      failedOutboundContent: prompt,
    );
  }

  Future<void> pickImage(ImageSource source) async {
    try {
      final picker = ref.read(imagePickerProvider);
      if (source == ImageSource.gallery) {
        final slots = maxImageDiscoveryImages - state.images.length;
        if (slots <= 0) return;
        if (slots == 1) {
          final file = await picker.pickImage(source: ImageSource.gallery);
          if (file != null) await addImage(file);
          return;
        }

        final files = await picker.pickMultiImage(limit: slots);
        await addImages(files);
        return;
      }

      final file = await picker.pickImage(source: source);
      if (file == null) return;
      await addImage(file);
    } catch (_) {
      state = state.copyWith(error: ImageDiscoveryError.unableToLoadImage);
    }
  }

  Future<void> setImage(XFile file) async {
    await addImages([file], replace: true);
  }

  Future<void> addImage(XFile file) async {
    await addImages([file], replace: false);
  }

  Future<void> addImages(List<XFile> files, {bool replace = false}) async {
    if (files.isEmpty) return;
    final existing = replace ? <ImageDiscoveryImage>[] : state.images;
    final slots = maxImageDiscoveryImages - existing.length;
    if (slots <= 0) {
      state = state.copyWith(error: ImageDiscoveryError.maxImagesReached);
      return;
    }

    final nextImages = <ImageDiscoveryImage>[];
    var nextIndex = existing.length;
    for (final file in files.take(slots)) {
      nextImages.add(await _readImage(file, nextIndex));
      nextIndex += 1;
    }

    final capped = files.length > slots;
    state = state.copyWith(
      images: [...existing, ...nextImages],
      error: capped ? 'You can analyze up to 5 images at once' : null,
    );
  }

  void removeImage(String id) {
    state = state.copyWith(
      images: state.images.where((image) => image.id != id).toList(),
      messages: [],
      error: null,
    );
  }

  Future<void> sendPrompt(String prompt) async {
    final trimmed = prompt.trim();
    if (trimmed.isEmpty || state.isLoading) return;
    if (!state.hasImage) {
      state = state.copyWith(error: ImageDiscoveryError.addPhotoFirst);
      return;
    }

    final userMessage = ImageDiscoveryMessage(
      id: 'user-${DateTime.now().microsecondsSinceEpoch}',
      role: ImageDiscoveryMessageRole.user,
      text: trimmed,
    );
    final previousMessages = state.messages;

    final cancelToken = CancelToken();
    _cancelToken = cancelToken;
    _pendingPrompt = trimmed;

    state = state.copyWith(
      messages: [...previousMessages, userMessage],
      isLoading: true,
      error: null,
    );

    final session = _session;

    try {
      final api = ref.read(imageAnalysisApiProvider);
      final response = await api.analyze(
        images: state.images.map((image) => image.toRequestImage()).toList(),
        prompt: trimmed,
        chatHistory: previousMessages
            .map((message) => message.toChatHistoryMessage())
            .toList(),
        cancelToken: cancelToken,
      );
      if (session != _session) return;
      _cancelToken = null;
      _pendingPrompt = null;
      final assistantMessage = ImageDiscoveryMessage(
        id: 'assistant-${DateTime.now().microsecondsSinceEpoch}',
        role: ImageDiscoveryMessageRole.assistant,
        text: response.text,
        vocabularies: response.vocabularies,
      );
      state = state.copyWith(
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        error: null,
      );
    } catch (e) {
      if (session != _session) return;
      _cancelToken = null;
      _pendingPrompt = null;
      if (e is DioException && e.type == DioExceptionType.cancel) return;
      state = state.copyWith(
        messages: previousMessages,
        isLoading: false,
        error: ImageDiscoveryError.unableToAnalyzeImage,
        failedOutboundContent: trimmed,
      );
    }
  }

  Future<void> addVocabularyFromAnalysis(
    ImageAnalysisVocabulary vocabulary,
  ) async {
    try {
      final api = ref.read(imageAnalysisApiProvider);
      await api.addVocabularyFromAnalysis(vocabulary);
      ref.read(dataChangeBusProvider.notifier).emit({'bookmark'});
    } catch (_) {
      state = state.copyWith(
        error: ImageDiscoveryError.unableToSaveVocabulary,
      );
      rethrow;
    }
  }

  Future<ImageDiscoveryImage> _readImage(XFile file, int index) async {
    final bytes = await file.readAsBytes();
    return ImageDiscoveryImage(
      id: 'image-$index-${DateTime.now().microsecondsSinceEpoch}-${file.name}',
      bytes: bytes,
      base64: base64Encode(bytes),
      mimeType: _inferMimeType(file),
    );
  }

  String _inferMimeType(XFile file) {
    final explicit = file.mimeType?.toLowerCase();
    if (explicit != null && explicit.startsWith('image/')) {
      return explicit == 'image/jpg' ? 'image/jpeg' : explicit;
    }

    final sourceName = '${file.name} ${file.path}'.toLowerCase();
    if (sourceName.contains('.png')) return 'image/png';
    if (sourceName.contains('.webp')) return 'image/webp';
    if (sourceName.contains('.heic')) return 'image/heic';
    if (sourceName.contains('.heif')) return 'image/heif';
    return 'image/jpeg';
  }
}
