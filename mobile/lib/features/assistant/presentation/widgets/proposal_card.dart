import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/providers/providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../domain/assistant_state.dart';

/// Callback when a proposal is confirmed (REST call succeeded).
typedef ProposalSuccessCallback = void Function(int index);

/// Callback when a proposal is declined.
typedef ProposalDeclineCallback = void Function(int index);

/// Inline confirm card rendered below the AI message when a `propose`
/// SSE event arrives. Shows [title] (large), [description] (regular),
/// and two buttons using the proposal's labels.
///
/// On "Có" → calls the proposed REST endpoint with the user's auth
/// token. On "Não" → calls [onDecline] to dismiss the card.
///
/// Error handling:
/// - Validation / permission errors surface as inline error text.
/// - 403 shows "Não có quyèn" with no retry button.
/// - Other errors show the error message + "Thö lai" button.
class ProposalCard extends ConsumerStatefulWidget {
  const ProposalCard({
    super.key,
    required this.proposal,
    required this.index,
    this.onDecline,
    this.onSuccess,
  });

  final ProposalState proposal;
  final int index;
  final ProposalDeclineCallback? onDecline;
  final ProposalSuccessCallback? onSuccess;

  @override
  ConsumerState<ProposalCard> createState() => _ProposalCardState();
}

class _ProposalCardState extends ConsumerState<ProposalCard> {
  bool _loading = false;
  String? _error;
  bool _isForbidden = false;
  bool _succeeded = false;
  String? _successMessage;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final proposal = widget.proposal;

    return AppCard(
      variant: AppCardVariant.outlined,
      margin: const EdgeInsets.only(top: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            proposal.title,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyLarge,
              fontWeight: FontWeight.w600,
              color: c.foreground,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            proposal.description,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyMedium,
              color: c.mutedForeground,
            ),
          ),
          if (_succeeded) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Icon(Icons.check_circle_outline, color: c.success, size: 18),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    _successMessage ?? 'Thành công!',
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyMedium,
                      color: c.success,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ],
          if (_error != null && !_succeeded) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.error_outline, color: c.error, size: 18),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    _error!,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      color: c.error,
                    ),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          if (_succeeded)
            const SizedBox.shrink()
          else if (_loading)
            const Center(child: AppSpinner())
          else
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    onPressed: _onConfirm,
                    label: proposal.confirmLabel,
                    isFullWidth: true,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: AppButton(
                    onPressed: _onDecline,
                    label: proposal.declineLabel,
                    variant: AppButtonVariant.outline,
                    isFullWidth: true,
                  ),
                ),
              ],
            ),
          if (_error != null && !_isForbidden && !_succeeded) ...[
            const SizedBox(height: AppSpacing.sm),
            AppButton(
              onPressed: _onConfirm,
              label: 'Thử lại',
              variant: AppButtonVariant.outline,
              isFullWidth: true,
            ),
          ],
        ],
      ),
    );
  }

  void _onDecline() {
    widget.onDecline?.call(widget.index);
  }

  Future<void> _onConfirm() async {
    final proposal = widget.proposal;
    setState(() {
      _loading = true;
      _error = null;
      _isForbidden = false;
    });

    try {
      final dio = ref.read(dioProvider);
      final (method, path) = _parseEndpoint(proposal.endpoint);

      await switch (method) {
        'POST' =>
          dio.post<Map<String, dynamic>>(path, data: proposal.payload),
        'PATCH' =>
          dio.patch<Map<String, dynamic>>(path, data: proposal.payload),
        'PUT' =>
          dio.put<Map<String, dynamic>>(path, data: proposal.payload),
        'DELETE' => dio.delete<Map<String, dynamic>>(path),
        'GET' => dio.get<Map<String, dynamic>>(path),
        _ => throw ArgumentError('Unsupported HTTP method: $method'),
      };

      if (!mounted) return;

      setState(() {
        _loading = false;
        _succeeded = true;
        _successMessage = _successMessageForKind(proposal.kind);
      });

      widget.onSuccess?.call(widget.index);
    } on DioException catch (e) {
      if (!mounted) return;
      final status = e.response?.statusCode;

      setState(() {
        _loading = false;
        if (status == 403) {
          _error = 'Không có quyền';
          _isForbidden = true;
        } else if (status != null && status >= 400) {
          _error = 'Lỗi máy chủ ($status). Vui lòng thử lại.';
        } else {
          _error = 'Mất kết nối. Vui lòng thử lại.';
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      });
    }
  }

  /// Parses `"POST /api/v1/daily-goals"` → `('POST', '/api/v1/daily-goals')`.
  (String method, String path) _parseEndpoint(String endpoint) {
    final parts = endpoint.trim().split(RegExp(r'\s+'));
    if (parts.length < 2) {
      throw ArgumentError('Invalid endpoint format: $endpoint');
    }
    final method = parts[0].toUpperCase();
    var path = parts[1];

    if (!path.startsWith('/api/v1')) {
      path = '/api/v1$path';
    }

    return (method, path);
  }

  String _successMessageForKind(String kind) {
    return switch (kind) {
      'create_daily_goal' => 'Đã tạo mục tiêu!',
      'update_daily_goal' => 'Đã cập nhật mục tiêu!',
      'generate_custom_exercise_set' => 'Đã tạo bài tập!',
      _ => 'Thành công!',
    };
  }
}
