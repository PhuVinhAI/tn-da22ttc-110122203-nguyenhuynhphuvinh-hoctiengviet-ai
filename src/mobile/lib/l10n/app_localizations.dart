import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_de.dart';
import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_ja.dart';
import 'app_localizations_ko.dart';
import 'app_localizations_th.dart';
import 'app_localizations_vi.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of S
/// returned by `S.of(context)`.
///
/// Applications need to include `S.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: S.localizationsDelegates,
///   supportedLocales: S.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the S.supportedLocales
/// property.
abstract class S {
  S(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static S of(BuildContext context) {
    return Localizations.of<S>(context, S)!;
  }

  static const LocalizationsDelegate<S> delegate = _SDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('de'),
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('ja'),
    Locale('ko'),
    Locale('th'),
    Locale('vi'),
    Locale('zh'),
  ];

  /// No description provided for @accountDeletedSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Tài khoản của bạn đã được xóa'**
  String get accountDeletedSuccess;

  /// No description provided for @accountSection.
  ///
  /// In vi, this message translates to:
  /// **'Tài khoản'**
  String get accountSection;

  /// No description provided for @accuracyLabel.
  ///
  /// In vi, this message translates to:
  /// **'Độ chính xác'**
  String get accuracyLabel;

  /// No description provided for @accuracyPercentParam.
  ///
  /// In vi, this message translates to:
  /// **'Độ chính xác: {percent}%'**
  String accuracyPercentParam(Object percent);

  /// No description provided for @actionCannotBeUndone.
  ///
  /// In vi, this message translates to:
  /// **'Hành động này không thể hoàn tác.'**
  String get actionCannotBeUndone;

  /// No description provided for @actionsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Hành động'**
  String get actionsTitle;

  /// No description provided for @addGoalTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thêm mục tiêu'**
  String get addGoalTitle;

  /// No description provided for @addLabel.
  ///
  /// In vi, this message translates to:
  /// **'Thêm'**
  String get addLabel;

  /// No description provided for @addPhotoTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thêm ảnh'**
  String get addPhotoTitle;

  /// No description provided for @addedLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đã thêm'**
  String get addedLabel;

  /// No description provided for @aiAssistantBarSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Hiển thị trên màn hình bài học và bài tập'**
  String get aiAssistantBarSubtitle;

  /// No description provided for @aiAssistantBarTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thanh trợ lý AI'**
  String get aiAssistantBarTitle;

  /// No description provided for @aiAssistantTitle.
  ///
  /// In vi, this message translates to:
  /// **'Trợ lý AI'**
  String get aiAssistantTitle;

  /// No description provided for @aiFeedback.
  ///
  /// In vi, this message translates to:
  /// **'Phản hồi từ AI'**
  String get aiFeedback;

  /// No description provided for @aiWordsLabel.
  ///
  /// In vi, this message translates to:
  /// **'Từ AI'**
  String get aiWordsLabel;

  /// No description provided for @allLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả'**
  String get allLabel;

  /// No description provided for @allLearningDataDeleted.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả dữ liệu học tập đã được xóa'**
  String get allLearningDataDeleted;

  /// No description provided for @allScenarios.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả kịch bản'**
  String get allScenarios;

  /// No description provided for @alreadyHaveAccountPrompt.
  ///
  /// In vi, this message translates to:
  /// **'Đã có tài khoản?'**
  String get alreadyHaveAccountPrompt;

  /// No description provided for @alreadyHaveAll3GoalTypes.
  ///
  /// In vi, this message translates to:
  /// **'Bạn đã có đủ cả 3 loại mục tiêu'**
  String get alreadyHaveAll3GoalTypes;

  /// No description provided for @analyzeImage.
  ///
  /// In vi, this message translates to:
  /// **'Phân tích hình ảnh'**
  String get analyzeImage;

  /// No description provided for @appName.
  ///
  /// In vi, this message translates to:
  /// **'LinVNix'**
  String get appName;

  /// No description provided for @applyButton.
  ///
  /// In vi, this message translates to:
  /// **'Áp dụng'**
  String get applyButton;

  /// No description provided for @areYouSureLogOut.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc chắn muốn đăng xuất không?'**
  String get areYouSureLogOut;

  /// No description provided for @askAnythingHint.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi bất cứ điều gì...'**
  String get askAnythingHint;

  /// No description provided for @assistantSection.
  ///
  /// In vi, this message translates to:
  /// **'Trợ lý'**
  String get assistantSection;

  /// No description provided for @assistantWelcomeMessage.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu cuộc trò chuyện để nhận giải thích tức thì, luyện dịch hoặc giải đáp các khái niệm ngôn ngữ.'**
  String get assistantWelcomeMessage;

  /// No description provided for @attachedPhotosTitle.
  ///
  /// In vi, this message translates to:
  /// **'Ảnh đã đính kèm'**
  String get attachedPhotosTitle;

  /// No description provided for @authAlreadyHaveAccount.
  ///
  /// In vi, this message translates to:
  /// **'Đã có tài khoản?'**
  String get authAlreadyHaveAccount;

  /// No description provided for @authAppTagline.
  ///
  /// In vi, this message translates to:
  /// **'Học tiếng Việt mỗi ngày'**
  String get authAppTagline;

  /// No description provided for @authAppTitleSemantics.
  ///
  /// In vi, this message translates to:
  /// **'LinVNix - Học tiếng Việt'**
  String get authAppTitleSemantics;

  /// No description provided for @authBackToSettings.
  ///
  /// In vi, this message translates to:
  /// **'Quay lại cài đặt'**
  String get authBackToSettings;

  /// No description provided for @authBackToSignIn.
  ///
  /// In vi, this message translates to:
  /// **'Quay lại đăng nhập'**
  String get authBackToSignIn;

  /// No description provided for @authCheckEmail.
  ///
  /// In vi, this message translates to:
  /// **'Kiểm tra email của bạn'**
  String get authCheckEmail;

  /// No description provided for @authChooseStrongPassword.
  ///
  /// In vi, this message translates to:
  /// **'Chọn mật khẩu mạnh'**
  String get authChooseStrongPassword;

  /// No description provided for @authConfirmPassword.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận mật khẩu'**
  String get authConfirmPassword;

  /// No description provided for @authConfirmPasswordRequired.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng xác nhận mật khẩu'**
  String get authConfirmPasswordRequired;

  /// No description provided for @authContinueHome.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục'**
  String get authContinueHome;

  /// No description provided for @authCreateAccount.
  ///
  /// In vi, this message translates to:
  /// **'Tạo tài khoản'**
  String get authCreateAccount;

  /// No description provided for @authCreateAccountSemantics.
  ///
  /// In vi, this message translates to:
  /// **'Tạo tài khoản mới'**
  String get authCreateAccountSemantics;

  /// No description provided for @authDidNotReceiveCode.
  ///
  /// In vi, this message translates to:
  /// **'Không nhận được mã?'**
  String get authDidNotReceiveCode;

  /// No description provided for @authEmailHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập email của bạn'**
  String get authEmailHint;

  /// No description provided for @authEmailInputSemantics.
  ///
  /// In vi, this message translates to:
  /// **'Trường nhập email'**
  String get authEmailInputSemantics;

  /// No description provided for @authEmailInvalid.
  ///
  /// In vi, this message translates to:
  /// **'Nhập email hợp lệ'**
  String get authEmailInvalid;

  /// No description provided for @authEmailRequired.
  ///
  /// In vi, this message translates to:
  /// **'Email là bắt buộc'**
  String get authEmailRequired;

  /// No description provided for @authEmailVerification.
  ///
  /// In vi, this message translates to:
  /// **'Xác minh email'**
  String get authEmailVerification;

  /// No description provided for @authEmailVerified.
  ///
  /// In vi, this message translates to:
  /// **'Email đã được xác minh'**
  String get authEmailVerified;

  /// No description provided for @authEmailVerifiedSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Email của bạn đã được xác minh thành công'**
  String get authEmailVerifiedSuccess;

  /// No description provided for @authEnterResetCode.
  ///
  /// In vi, this message translates to:
  /// **'Nhập mã đặt lại'**
  String get authEnterResetCode;

  /// No description provided for @authForgotPassword.
  ///
  /// In vi, this message translates to:
  /// **'Quên mật khẩu?'**
  String get authForgotPassword;

  /// No description provided for @authForgotPasswordSemantics.
  ///
  /// In vi, this message translates to:
  /// **'Điều hướng đến trang quên mật khẩu'**
  String get authForgotPasswordSemantics;

  /// No description provided for @authForgotPasswordTitle.
  ///
  /// In vi, this message translates to:
  /// **'Quên mật khẩu'**
  String get authForgotPasswordTitle;

  /// No description provided for @authGoogleSignInSemantics.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập bằng Google'**
  String get authGoogleSignInSemantics;

  /// No description provided for @authHidePassword.
  ///
  /// In vi, this message translates to:
  /// **'Ẩn mật khẩu'**
  String get authHidePassword;

  /// No description provided for @authNewPassword.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu mới'**
  String get authNewPassword;

  /// No description provided for @authOr.
  ///
  /// In vi, this message translates to:
  /// **'hoặc'**
  String get authOr;

  /// No description provided for @authPasswordChangedSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu đã được thay đổi'**
  String get authPasswordChangedSuccess;

  /// No description provided for @authPasswordInputSemantics.
  ///
  /// In vi, this message translates to:
  /// **'Trường nhập mật khẩu'**
  String get authPasswordInputSemantics;

  /// No description provided for @authPasswordMismatch.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu không khớp'**
  String get authPasswordMismatch;

  /// No description provided for @authPasswordRequired.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu là bắt buộc'**
  String get authPasswordRequired;

  /// No description provided for @authPasswordResetSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại thành công'**
  String get authPasswordResetSuccess;

  /// No description provided for @authPasswordResetSuccessMessage.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu của bạn đã được đặt lại thành công.'**
  String get authPasswordResetSuccessMessage;

  /// No description provided for @authResend.
  ///
  /// In vi, this message translates to:
  /// **'Gửi lại'**
  String get authResend;

  /// No description provided for @authResendCodeFailed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể gửi lại mã'**
  String get authResendCodeFailed;

  /// No description provided for @authResetCodeDescription.
  ///
  /// In vi, this message translates to:
  /// **'Chúng tôi đã gửi mã 6 chữ số tới'**
  String get authResetCodeDescription;

  /// No description provided for @authResetCodeSent.
  ///
  /// In vi, this message translates to:
  /// **'Mã đặt lại mới đã được gửi'**
  String get authResetCodeSent;

  /// No description provided for @authResetPassword.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại mật khẩu'**
  String get authResetPassword;

  /// No description provided for @authResetPasswordDescription.
  ///
  /// In vi, this message translates to:
  /// **'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi mã đặt lại.'**
  String get authResetPasswordDescription;

  /// No description provided for @authSendResetCode.
  ///
  /// In vi, this message translates to:
  /// **'Gửi mã đặt lại'**
  String get authSendResetCode;

  /// No description provided for @authSetNewPassword.
  ///
  /// In vi, this message translates to:
  /// **'Đặt mật khẩu mới'**
  String get authSetNewPassword;

  /// No description provided for @authShowPassword.
  ///
  /// In vi, this message translates to:
  /// **'Hiện mật khẩu'**
  String get authShowPassword;

  /// No description provided for @authSignIn.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get authSignIn;

  /// No description provided for @authSignInSemantics.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập vào tài khoản của bạn'**
  String get authSignInSemantics;

  /// No description provided for @authVerificationCodeSent.
  ///
  /// In vi, this message translates to:
  /// **'Mã xác minh mới đã được gửi'**
  String get authVerificationCodeSent;

  /// No description provided for @authVerificationFailed.
  ///
  /// In vi, this message translates to:
  /// **'Xác minh thất bại'**
  String get authVerificationFailed;

  /// No description provided for @authVerify.
  ///
  /// In vi, this message translates to:
  /// **'Xác minh'**
  String get authVerify;

  /// No description provided for @authVerifyCode.
  ///
  /// In vi, this message translates to:
  /// **'Xác minh mã'**
  String get authVerifyCode;

  /// No description provided for @authVerifyingCode.
  ///
  /// In vi, this message translates to:
  /// **'Đang xác minh mã...'**
  String get authVerifyingCode;

  /// No description provided for @avgScore.
  ///
  /// In vi, this message translates to:
  /// **'Điểm trung bình'**
  String get avgScore;

  /// No description provided for @backButton.
  ///
  /// In vi, this message translates to:
  /// **'Quay lại'**
  String get backButton;

  /// No description provided for @backToSignInButton.
  ///
  /// In vi, this message translates to:
  /// **'Quay lại đăng nhập'**
  String get backToSignInButton;

  /// No description provided for @bookmarksTitle.
  ///
  /// In vi, this message translates to:
  /// **'Dấu trang'**
  String get bookmarksTitle;

  /// No description provided for @browseAvailableCourses.
  ///
  /// In vi, this message translates to:
  /// **'Xem các khóa học hiện có'**
  String get browseAvailableCourses;

  /// No description provided for @browseCourses.
  ///
  /// In vi, this message translates to:
  /// **'Xem các khóa học'**
  String get browseCourses;

  /// No description provided for @bypassDialogContent.
  ///
  /// In vi, this message translates to:
  /// **'Bạn đã chọn trình độ cao hơn. Bạn có thể bỏ qua bài học và đi thẳng đến bài tập.'**
  String get bypassDialogContent;

  /// No description provided for @bypassDialogTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bỏ qua bài học?'**
  String get bypassDialogTitle;

  /// No description provided for @cancelButton.
  ///
  /// In vi, this message translates to:
  /// **'Hủy'**
  String get cancelButton;

  /// No description provided for @cancelButton2.
  ///
  /// In vi, this message translates to:
  /// **'Hủy'**
  String get cancelButton2;

  /// No description provided for @categoryTitle.
  ///
  /// In vi, this message translates to:
  /// **'Danh mục'**
  String get categoryTitle;

  /// No description provided for @centralDialect.
  ///
  /// In vi, this message translates to:
  /// **'Miền Trung'**
  String get centralDialect;

  /// No description provided for @centralDialectDescription.
  ///
  /// In vi, this message translates to:
  /// **'Miền Trung Việt Nam (Huế, Đà Nẵng)'**
  String get centralDialectDescription;

  /// No description provided for @changePasswordSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Gửi mã xác minh đến email của bạn'**
  String get changePasswordSubtitle;

  /// No description provided for @changePasswordTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đổi mật khẩu'**
  String get changePasswordTitle;

  /// No description provided for @charactersTitle.
  ///
  /// In vi, this message translates to:
  /// **'Nhân vật'**
  String get charactersTitle;

  /// No description provided for @chatTitle.
  ///
  /// In vi, this message translates to:
  /// **'Trò chuyện'**
  String get chatTitle;

  /// No description provided for @chooseCharacterTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chọn nhân vật'**
  String get chooseCharacterTitle;

  /// No description provided for @classifierLabel.
  ///
  /// In vi, this message translates to:
  /// **'Bộ phân loại:'**
  String get classifierLabel;

  /// No description provided for @classifierLabelParam.
  ///
  /// In vi, this message translates to:
  /// **'Bộ phân loại: {classifier}'**
  String classifierLabelParam(Object classifier);

  /// No description provided for @clearAnswersStartOver.
  ///
  /// In vi, this message translates to:
  /// **'Xóa câu trả lời và bắt đầu lại'**
  String get clearAnswersStartOver;

  /// No description provided for @clearCacheSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Xóa ảnh đã tải, bộ nhớ đệm tạm thời và dữ liệu trong phiên'**
  String get clearCacheSubtitle;

  /// No description provided for @clearCacheSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đã xóa cache ứng dụng'**
  String get clearCacheSuccess;

  /// No description provided for @clearCacheTitle.
  ///
  /// In vi, this message translates to:
  /// **'Xóa cache ứng dụng'**
  String get clearCacheTitle;

  /// No description provided for @clearCacheWarningDesc.
  ///
  /// In vi, this message translates to:
  /// **'Hành động này sẽ xóa ảnh đã tải, bộ nhớ đệm mạng và dữ liệu trong phiên. Tiến trình học và tài khoản của bạn không bị ảnh hưởng.'**
  String get clearCacheWarningDesc;

  /// No description provided for @clearDataSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Xóa tất cả tiến độ, dấu trang, thống kê và lịch sử AI'**
  String get clearDataSubtitle;

  /// No description provided for @clearDataTitle.
  ///
  /// In vi, this message translates to:
  /// **'Xóa dữ liệu'**
  String get clearDataTitle;

  /// No description provided for @clearDataWarningDesc.
  ///
  /// In vi, this message translates to:
  /// **'Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu học tập của bạn khỏi hệ thống: tiến trình, kết quả bài tập, dấu trang, mục tiêu hàng ngày và lịch sử trò chuyện AI. Tài khoản của bạn sẽ vẫn hoạt động nhưng bạn sẽ cần phải hoàn thành lại phần khảo sát ban đầu.'**
  String get clearDataWarningDesc;

  /// No description provided for @closeButton.
  ///
  /// In vi, this message translates to:
  /// **'Đóng'**
  String get closeButton;

  /// No description provided for @completeAll.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn thành tất cả'**
  String get completeAll;

  /// No description provided for @completeLabel.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn thành!'**
  String get completeLabel;

  /// No description provided for @completeLowerCoursesCheckbox.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn thành tất cả các khóa học trình độ thấp hơn trước'**
  String get completeLowerCoursesCheckbox;

  /// No description provided for @completedCountParam.
  ///
  /// In vi, this message translates to:
  /// **'Đã hoàn thành {completed}/{total}'**
  String completedCountParam(Object completed, Object total);

  /// No description provided for @completedLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đã hoàn thành'**
  String get completedLabel;

  /// No description provided for @composeAgain.
  ///
  /// In vi, this message translates to:
  /// **'Soạn tiếp'**
  String get composeAgain;

  /// No description provided for @confirmPasswordHint.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận mật khẩu của bạn'**
  String get confirmPasswordHint;

  /// No description provided for @confirmPasswordLabel.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận mật khẩu'**
  String get confirmPasswordLabel;

  /// No description provided for @confirmPasswordRequiredError.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng xác nhận mật khẩu của bạn'**
  String get confirmPasswordRequiredError;

  /// No description provided for @continueLesson.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục bài học?'**
  String get continueLesson;

  /// No description provided for @continueLessonContent.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có một bài học đang tiến hành. Bạn có muốn bỏ qua đến bài tập không?'**
  String get continueLessonContent;

  /// No description provided for @continueSection.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục học'**
  String get continueSection;

  /// No description provided for @continueToExercises.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục đến bài tập'**
  String get continueToExercises;

  /// No description provided for @continueWithLessonsButton.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục với bài học'**
  String get continueWithLessonsButton;

  /// No description provided for @conversationHistoryTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử trò chuyện'**
  String get conversationHistoryTitle;

  /// No description provided for @conversationList.
  ///
  /// In vi, this message translates to:
  /// **'Danh sách trò chuyện'**
  String get conversationList;

  /// No description provided for @conversationLossWarning.
  ///
  /// In vi, this message translates to:
  /// **'Tiến trình trò chuyện sẽ bị mất và không thể khôi phục.'**
  String get conversationLossWarning;

  /// No description provided for @conversationProgressLost.
  ///
  /// In vi, this message translates to:
  /// **'Tiến trình trò chuyện sẽ bị mất và không thể khôi phục.'**
  String get conversationProgressLost;

  /// No description provided for @copiedToast.
  ///
  /// In vi, this message translates to:
  /// **'Đã sao chép'**
  String get copiedToast;

  /// No description provided for @copyTranslation.
  ///
  /// In vi, this message translates to:
  /// **'Sao chép bản dịch'**
  String get copyTranslation;

  /// No description provided for @copyVietnamese.
  ///
  /// In vi, this message translates to:
  /// **'Sao chép tiếng Việt'**
  String get copyVietnamese;

  /// No description provided for @correctAnswers.
  ///
  /// In vi, this message translates to:
  /// **'Câu trả lời đúng'**
  String get correctAnswers;

  /// No description provided for @couldNotClearCache.
  ///
  /// In vi, this message translates to:
  /// **'Không thể xóa cache'**
  String get couldNotClearCache;

  /// No description provided for @couldNotClearData.
  ///
  /// In vi, this message translates to:
  /// **'Không thể xóa dữ liệu'**
  String get couldNotClearData;

  /// No description provided for @couldNotDeleteAccount.
  ///
  /// In vi, this message translates to:
  /// **'Không thể xóa tài khoản'**
  String get couldNotDeleteAccount;

  /// No description provided for @couldNotLoadConversations.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải cuộc trò chuyện'**
  String get couldNotLoadConversations;

  /// No description provided for @couldNotStartPasswordReset.
  ///
  /// In vi, this message translates to:
  /// **'Không thể bắt đầu đặt lại mật khẩu'**
  String get couldNotStartPasswordReset;

  /// No description provided for @courseDetailTitle.
  ///
  /// In vi, this message translates to:
  /// **'Khóa học'**
  String get courseDetailTitle;

  /// No description provided for @coursesSection.
  ///
  /// In vi, this message translates to:
  /// **'Khóa học'**
  String get coursesSection;

  /// No description provided for @coursesTitle.
  ///
  /// In vi, this message translates to:
  /// **'Khóa học'**
  String get coursesTitle;

  /// No description provided for @createCustomPractice.
  ///
  /// In vi, this message translates to:
  /// **'Tạo luyện tập tùy chỉnh'**
  String get createCustomPractice;

  /// No description provided for @createCustomExercise.
  ///
  /// In vi, this message translates to:
  /// **'Tạo bài tập tùy chỉnh'**
  String get createCustomExercise;

  /// No description provided for @createCustomExercisePrompt.
  ///
  /// In vi, this message translates to:
  /// **'Tạo bài tập tùy chỉnh để bắt đầu luyện tập!'**
  String get createCustomExercisePrompt;

  /// No description provided for @currentLevelLabel.
  ///
  /// In vi, this message translates to:
  /// **'Trình độ hiện tại'**
  String get currentLevelLabel;

  /// No description provided for @dailyGoals.
  ///
  /// In vi, this message translates to:
  /// **'Mục tiêu hàng ngày'**
  String get dailyGoals;

  /// No description provided for @darkTheme.
  ///
  /// In vi, this message translates to:
  /// **'Tối'**
  String get darkTheme;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In vi, this message translates to:
  /// **'Xóa tài khoản'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountWarningDesc1.
  ///
  /// In vi, this message translates to:
  /// **'Hành động này sẽ xóa vĩnh viễn tài khoản của bạn và toàn bộ dữ liệu liên quan. '**
  String get deleteAccountWarningDesc1;

  /// No description provided for @deleteAndRegenerate.
  ///
  /// In vi, this message translates to:
  /// **'Xóa và tạo lại'**
  String get deleteAndRegenerate;

  /// No description provided for @deleteConversation.
  ///
  /// In vi, this message translates to:
  /// **'Xóa cuộc trò chuyện'**
  String get deleteConversation;

  /// No description provided for @deleteCustomPracticeExerciseWarning.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập này sẽ bị xóa khỏi danh sách của bạn. Bạn có thể tạo bài tập mới bất cứ lúc nào.'**
  String get deleteCustomPracticeExerciseWarning;

  /// No description provided for @deleteCustomExerciseQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Xóa bài tập tùy chỉnh?'**
  String get deleteCustomExerciseQuestion;

  /// No description provided for @deleteData.
  ///
  /// In vi, this message translates to:
  /// **'Xóa dữ liệu'**
  String get deleteData;

  /// No description provided for @deleteGoal.
  ///
  /// In vi, this message translates to:
  /// **'Xóa mục tiêu'**
  String get deleteGoal;

  /// No description provided for @deleteGoalPermanentlyQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Xóa vĩnh viễn mục tiêu \"{goalType}\"?'**
  String deleteGoalPermanentlyQuestion(Object goalType);

  /// No description provided for @deleteLabel.
  ///
  /// In vi, this message translates to:
  /// **'Xóa'**
  String get deleteLabel;

  /// No description provided for @deleteMessageChainQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Tin nhắn này và toàn bộ tin nhắn phía sau sẽ bị xóa. Bạn có chắc chắn không?'**
  String get deleteMessageChainQuestion;

  /// No description provided for @deleteExercise.
  ///
  /// In vi, this message translates to:
  /// **'Xóa bài tập'**
  String get deleteExercise;

  /// No description provided for @developerSection.
  ///
  /// In vi, this message translates to:
  /// **'Nhà phát triển'**
  String get developerSection;

  /// No description provided for @didNotReceiveCodePrompt.
  ///
  /// In vi, this message translates to:
  /// **'Không nhận được mã?'**
  String get didNotReceiveCodePrompt;

  /// No description provided for @difficultyEasy.
  ///
  /// In vi, this message translates to:
  /// **'Dễ'**
  String get difficultyEasy;

  /// No description provided for @difficultyHard.
  ///
  /// In vi, this message translates to:
  /// **'Khó'**
  String get difficultyHard;

  /// No description provided for @difficultyLabel.
  ///
  /// In vi, this message translates to:
  /// **'Độ khó'**
  String get difficultyLabel;

  /// No description provided for @difficultyMedium.
  ///
  /// In vi, this message translates to:
  /// **'Trung bình'**
  String get difficultyMedium;

  /// No description provided for @editGoalTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chỉnh sửa {goalType}'**
  String editGoalTitle(Object goalType);

  /// No description provided for @editProfileSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Tên, ngôn ngữ, trình độ, phương ngữ'**
  String get editProfileSubtitle;

  /// No description provided for @editProfileTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chỉnh sửa hồ sơ'**
  String get editProfileTitle;

  /// No description provided for @emailHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập email của bạn'**
  String get emailHint;

  /// No description provided for @emailLabel.
  ///
  /// In vi, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @emailRequiredError.
  ///
  /// In vi, this message translates to:
  /// **'Email là bắt buộc'**
  String get emailRequiredError;

  /// No description provided for @endConversationQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Kết thúc trò chuyện?'**
  String get endConversationQuestion;

  /// No description provided for @endSession.
  ///
  /// In vi, this message translates to:
  /// **'Kết thúc phiên'**
  String get endSession;

  /// No description provided for @endSessionConfirmationPrompt.
  ///
  /// In vi, this message translates to:
  /// **'Kết thúc phiên này để bắt đầu kịch bản này? Tiến trình không thể khôi phục.'**
  String get endSessionConfirmationPrompt;

  /// No description provided for @endSessionWarningParam.
  ///
  /// In vi, this message translates to:
  /// **'Bạn đang có một phiên hoạt động cho \"{title}\". Kết thúc phiên đó để bắt đầu kịch bản này? Tiến trình không thể khôi phục.'**
  String endSessionWarningParam(Object title);

  /// No description provided for @enterResetCodeTitle.
  ///
  /// In vi, this message translates to:
  /// **'Nhập mã đặt lại'**
  String get enterResetCodeTitle;

  /// No description provided for @errorLoadingCategories.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi khi tải danh mục'**
  String get errorLoadingCategories;

  /// No description provided for @errorLoadingCourses.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi khi tải khóa học'**
  String get errorLoadingCourses;

  /// No description provided for @errorLoadingSimulationStats.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi khi tải thống kê mô phỏng'**
  String get errorLoadingSimulationStats;

  /// No description provided for @errorLoadingStats.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi khi tải thống kê'**
  String get errorLoadingStats;

  /// No description provided for @errorParam.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi: {error}'**
  String errorParam(Object error);

  /// No description provided for @exampleLabel.
  ///
  /// In vi, this message translates to:
  /// **'Ví dụ:'**
  String get exampleLabel;

  /// No description provided for @exerciseComplete.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập hoàn thành!'**
  String get exerciseComplete;

  /// No description provided for @exercisePlayTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập'**
  String get exercisePlayTitle;

  /// No description provided for @exercisesDone.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập đã làm'**
  String get exercisesDone;

  /// No description provided for @questionsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Câu hỏi'**
  String get questionsTitle;

  /// No description provided for @exercisesTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập'**
  String get exercisesTitle;

  /// No description provided for @exitButton.
  ///
  /// In vi, this message translates to:
  /// **'Thoát'**
  String get exitButton;

  /// No description provided for @explainContent.
  ///
  /// In vi, this message translates to:
  /// **'Giải thích nội dung'**
  String get explainContent;

  /// No description provided for @failedToLoadCategoriesMessage.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải danh mục'**
  String get failedToLoadCategoriesMessage;

  /// No description provided for @failedToLoadCategoriesTitle.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải danh mục'**
  String get failedToLoadCategoriesTitle;

  /// No description provided for @failedToLoadCourse.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải khóa học'**
  String get failedToLoadCourse;

  /// No description provided for @failedToLoadCourses.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải khóa học'**
  String get failedToLoadCourses;

  /// No description provided for @failedToLoadLesson.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải bài học'**
  String get failedToLoadLesson;

  /// No description provided for @failedToLoadModule.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải mô-đun'**
  String get failedToLoadModule;

  /// No description provided for @failedToLoadSettings.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải cài đặt'**
  String get failedToLoadSettings;

  /// No description provided for @failedToUpdateLevelParam.
  ///
  /// In vi, this message translates to:
  /// **'Không thể cập nhật trình độ: {error}'**
  String failedToUpdateLevelParam(Object error);

  /// No description provided for @failedToUpdateProfileParam.
  ///
  /// In vi, this message translates to:
  /// **'Không thể cập nhật hồ sơ: {error}'**
  String failedToUpdateProfileParam(Object error);

  /// No description provided for @fillInTheBlank.
  ///
  /// In vi, this message translates to:
  /// **'Điền vào chỗ trống'**
  String get fillInTheBlank;

  /// No description provided for @fillBlanksCountParam.
  ///
  /// In vi, this message translates to:
  /// **'Điền {count} chỗ trống'**
  String fillBlanksCountParam(Object count);

  /// No description provided for @findVocabulary.
  ///
  /// In vi, this message translates to:
  /// **'Tìm từ vựng'**
  String get findVocabulary;

  /// No description provided for @finishButton.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn thành'**
  String get finishButton;

  /// No description provided for @forgotPasswordButton.
  ///
  /// In vi, this message translates to:
  /// **'Quên mật khẩu?'**
  String get forgotPasswordButton;

  /// No description provided for @forgotPasswordTitle.
  ///
  /// In vi, this message translates to:
  /// **'Quên mật khẩu'**
  String get forgotPasswordTitle;

  /// No description provided for @fullScreen.
  ///
  /// In vi, this message translates to:
  /// **'Toàn màn hình'**
  String get fullScreen;

  /// No description provided for @generatingExercises.
  ///
  /// In vi, this message translates to:
  /// **'Đang tạo bài tập...'**
  String get generatingExercises;

  /// No description provided for @goBack.
  ///
  /// In vi, this message translates to:
  /// **'Quay lại'**
  String get goBack;

  /// No description provided for @goToExercisesButton.
  ///
  /// In vi, this message translates to:
  /// **'Đi đến bài tập'**
  String get goToExercisesButton;

  /// No description provided for @goToNextStep.
  ///
  /// In vi, this message translates to:
  /// **'Đến bước tiếp theo'**
  String get goToNextStep;

  /// No description provided for @goToPreviousStep.
  ///
  /// In vi, this message translates to:
  /// **'Quay lại bước trước'**
  String get goToPreviousStep;

  /// No description provided for @goalTypeLabel.
  ///
  /// In vi, this message translates to:
  /// **'Loại mục tiêu'**
  String get goalTypeLabel;

  /// No description provided for @goodAfternoon.
  ///
  /// In vi, this message translates to:
  /// **'Chào buổi chiều'**
  String get goodAfternoon;

  /// No description provided for @goodEvening.
  ///
  /// In vi, this message translates to:
  /// **'Chào buổi tối'**
  String get goodEvening;

  /// No description provided for @goodMorning.
  ///
  /// In vi, this message translates to:
  /// **'Chào buổi sáng'**
  String get goodMorning;

  /// No description provided for @googleRegisterButton.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký với Google'**
  String get googleRegisterButton;

  /// No description provided for @googleSignInButton.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập với Google'**
  String get googleSignInButton;

  /// No description provided for @googleSignInFailedDescParam.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập Google thất bại: {description}'**
  String googleSignInFailedDescParam(Object description);

  /// No description provided for @googleSignInFailedParam.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập Google thất bại: {error}'**
  String googleSignInFailedParam(Object error);

  /// No description provided for @gradingCriteria.
  ///
  /// In vi, this message translates to:
  /// **'Tiêu chí chấm điểm'**
  String get gradingCriteria;

  /// No description provided for @grammarTitle.
  ///
  /// In vi, this message translates to:
  /// **'Ngữ pháp'**
  String get grammarTitle;

  /// No description provided for @homeNavBar.
  ///
  /// In vi, this message translates to:
  /// **'Trang chủ'**
  String get homeNavBar;

  /// No description provided for @homeTitle.
  ///
  /// In vi, this message translates to:
  /// **'Trang chủ'**
  String get homeTitle;

  /// No description provided for @imageDiscoveryTitle.
  ///
  /// In vi, this message translates to:
  /// **'Khám phá hình ảnh'**
  String get imageDiscoveryTitle;

  /// No description provided for @inProgressLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đang thực hiện'**
  String get inProgressLabel;

  /// No description provided for @justNowLabel.
  ///
  /// In vi, this message translates to:
  /// **'Vừa xong'**
  String get justNowLabel;

  /// No description provided for @languageEnglish.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Anh'**
  String get languageEnglish;

  /// No description provided for @languageSection.
  ///
  /// In vi, this message translates to:
  /// **'Ngôn ngữ giao diện'**
  String get languageSection;

  /// No description provided for @languageVietnamese.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Việt'**
  String get languageVietnamese;

  /// No description provided for @lessonExercisesTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập của bài học'**
  String get lessonExercisesTitle;

  /// No description provided for @lessonTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bài học'**
  String get lessonTitle;

  /// No description provided for @lessonWordsLabel.
  ///
  /// In vi, this message translates to:
  /// **'Từ bài học'**
  String get lessonWordsLabel;

  /// No description provided for @lessonsCompleted.
  ///
  /// In vi, this message translates to:
  /// **'Bài học đã hoàn thành'**
  String get lessonsCompleted;

  /// No description provided for @lessonsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bài học'**
  String get lessonsTitle;

  /// No description provided for @letsPractice.
  ///
  /// In vi, this message translates to:
  /// **'Hãy luyện tập'**
  String get letsPractice;

  /// No description provided for @levelLabel.
  ///
  /// In vi, this message translates to:
  /// **'Trình độ'**
  String get levelLabel;

  /// No description provided for @levelUpProfileQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Thăng cấp hồ sơ?'**
  String get levelUpProfileQuestion;

  /// No description provided for @lightTheme.
  ///
  /// In vi, this message translates to:
  /// **'Sáng'**
  String get lightTheme;

  /// No description provided for @listeningExercise.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập nghe'**
  String get listeningExercise;

  /// No description provided for @logOutLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đăng xuất'**
  String get logOutLabel;

  /// No description provided for @loginSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Chào mừng trở lại'**
  String get loginSubtitle;

  /// No description provided for @loginTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get loginTitle;

  /// No description provided for @longestStreak.
  ///
  /// In vi, this message translates to:
  /// **'Chuỗi ngày dài nhất'**
  String get longestStreak;

  /// No description provided for @markAllLessonsCompletedQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Đánh dấu tất cả bài học là đã hoàn thành?'**
  String get markAllLessonsCompletedQuestion;

  /// No description provided for @markCourseCompleteWarning.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả bài học trong khóa học này sẽ được đánh dấu là hoàn thành. Bạn có thể đặt lại sau nếu cần.'**
  String get markCourseCompleteWarning;

  /// No description provided for @markModuleCompleteWarning.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả bài học trong học phần này sẽ được đánh dấu là hoàn thành. Bạn có thể đặt lại sau nếu cần.'**
  String get markModuleCompleteWarning;

  /// No description provided for @matchingExercise.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập nối cặp'**
  String get matchingExercise;

  /// No description provided for @moduleDetailTitle.
  ///
  /// In vi, this message translates to:
  /// **'Mô-đun'**
  String get moduleDetailTitle;

  /// No description provided for @modulesTitle.
  ///
  /// In vi, this message translates to:
  /// **'Mô-đun'**
  String get modulesTitle;

  /// No description provided for @moreLabel.
  ///
  /// In vi, this message translates to:
  /// **'Thêm'**
  String get moreLabel;

  /// No description provided for @multipleChoice.
  ///
  /// In vi, this message translates to:
  /// **'Trắc nghiệm'**
  String get multipleChoice;

  /// No description provided for @nameHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập họ và tên của bạn'**
  String get nameHint;

  /// No description provided for @nameLabel.
  ///
  /// In vi, this message translates to:
  /// **'Họ và tên'**
  String get nameLabel;

  /// No description provided for @nativeLanguageLabel.
  ///
  /// In vi, this message translates to:
  /// **'Ngôn ngữ mẹ đẻ'**
  String get nativeLanguageLabel;

  /// No description provided for @newConversation.
  ///
  /// In vi, this message translates to:
  /// **'Cuộc trò chuyện mới'**
  String get newConversation;

  /// No description provided for @newPasswordHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập mật khẩu mới'**
  String get newPasswordHint;

  /// No description provided for @newPasswordLabel.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu mới'**
  String get newPasswordLabel;

  /// No description provided for @nextButton.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp theo'**
  String get nextButton;

  /// No description provided for @nextQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Câu hỏi tiếp theo'**
  String get nextQuestion;

  /// No description provided for @noCategoriesIcon.
  ///
  /// In vi, this message translates to:
  /// **'Biểu tượng không có danh mục'**
  String get noCategoriesIcon;

  /// No description provided for @noContentAvailable.
  ///
  /// In vi, this message translates to:
  /// **'Không có nội dung'**
  String get noContentAvailable;

  /// No description provided for @noConversationsYet.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có cuộc trò chuyện nào'**
  String get noConversationsYet;

  /// No description provided for @noCoursesAvailable.
  ///
  /// In vi, this message translates to:
  /// **'Không có khóa học nào'**
  String get noCoursesAvailable;

  /// No description provided for @noCoursesAvailableIcon.
  ///
  /// In vi, this message translates to:
  /// **'Biểu tượng không có khóa học'**
  String get noCoursesAvailableIcon;

  /// No description provided for @noCustomExercisesYet.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có bài tập tùy chỉnh nào. Hãy tạo một bài tập để ôn tập những gì bạn đã học.'**
  String get noCustomExercisesYet;

  /// No description provided for @noExercisesYet.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có bài tập nào'**
  String get noExercisesYet;

  /// No description provided for @noGrammarRulesForLesson.
  ///
  /// In vi, this message translates to:
  /// **'Không có quy tắc ngữ pháp nào cho bài học này'**
  String get noGrammarRulesForLesson;

  /// No description provided for @noHistoryYet.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có lịch sử'**
  String get noHistoryYet;

  /// No description provided for @noLabel.
  ///
  /// In vi, this message translates to:
  /// **'Không'**
  String get noLabel;

  /// No description provided for @noMatchesFound.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy kết quả'**
  String get noMatchesFound;

  /// No description provided for @noSavedWords.
  ///
  /// In vi, this message translates to:
  /// **'Không có từ đã lưu'**
  String get noSavedWords;

  /// No description provided for @noThanks.
  ///
  /// In vi, this message translates to:
  /// **'Không, cảm ơn'**
  String get noThanks;

  /// No description provided for @noVocabularyForLesson.
  ///
  /// In vi, this message translates to:
  /// **'Không có từ vựng nào cho bài học này'**
  String get noVocabularyForLesson;

  /// No description provided for @northernDialect.
  ///
  /// In vi, this message translates to:
  /// **'Miền Bắc'**
  String get northernDialect;

  /// No description provided for @northernDialectDescription.
  ///
  /// In vi, this message translates to:
  /// **'Miền Bắc Việt Nam (Hà Nội)'**
  String get northernDialectDescription;

  /// No description provided for @notNow.
  ///
  /// In vi, this message translates to:
  /// **'Để sau'**
  String get notNow;

  /// No description provided for @notStartedLabel.
  ///
  /// In vi, this message translates to:
  /// **'Chưa bắt đầu'**
  String get notStartedLabel;

  /// No description provided for @onboardingCompleteMessage.
  ///
  /// In vi, this message translates to:
  /// **'Bạn đã sẵn sàng để bắt đầu học'**
  String get onboardingCompleteMessage;

  /// No description provided for @onboardingCompleteTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả đã sẵn sàng!'**
  String get onboardingCompleteTitle;

  /// No description provided for @onboardingSelectDialectDescription.
  ///
  /// In vi, this message translates to:
  /// **'Chọn phương ngữ tiếng Việt bạn muốn tập trung học.'**
  String get onboardingSelectDialectDescription;

  /// No description provided for @onboardingSelectGoalsDescription.
  ///
  /// In vi, this message translates to:
  /// **'Chọn mục tiêu bạn muốn theo dõi. Bạn có thể thay đổi sau trong Trang cá nhân.'**
  String get onboardingSelectGoalsDescription;

  /// No description provided for @onboardingSelectLevelDescription.
  ///
  /// In vi, this message translates to:
  /// **'Chọn trình độ mô tả chính xác nhất năng lực tiếng Việt của bạn.'**
  String get onboardingSelectLevelDescription;

  /// No description provided for @orText.
  ///
  /// In vi, this message translates to:
  /// **'hoặc'**
  String get orText;

  /// No description provided for @orderingExercise.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập sắp xếp'**
  String get orderingExercise;

  /// No description provided for @passwordHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập mật khẩu'**
  String get passwordHint;

  /// No description provided for @passwordLabel.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu'**
  String get passwordLabel;

  /// No description provided for @passwordMismatchError.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu không khớp'**
  String get passwordMismatchError;

  /// No description provided for @passwordRequiredError.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu là bắt buộc'**
  String get passwordRequiredError;

  /// No description provided for @permanentlyRemoveAccountData.
  ///
  /// In vi, this message translates to:
  /// **'Xóa vĩnh viễn tài khoản và dữ liệu của bạn'**
  String get permanentlyRemoveAccountData;

  /// No description provided for @playAgain.
  ///
  /// In vi, this message translates to:
  /// **'Chơi lại'**
  String get playAgain;

  /// No description provided for @playPronunciation.
  ///
  /// In vi, this message translates to:
  /// **'Phát âm'**
  String get playPronunciation;

  /// No description provided for @pleaseEnableNotificationsSettings.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng bật thông báo trong cài đặt thiết bị'**
  String get pleaseEnableNotificationsSettings;

  /// No description provided for @practiceSection.
  ///
  /// In vi, this message translates to:
  /// **'Luyện tập'**
  String get practiceSection;

  /// No description provided for @practiceTitle.
  ///
  /// In vi, this message translates to:
  /// **'Trò chuyện'**
  String get practiceTitle;

  /// No description provided for @preferredDialectLabel.
  ///
  /// In vi, this message translates to:
  /// **'Phương ngữ ưa thích'**
  String get preferredDialectLabel;

  /// No description provided for @previous30Days.
  ///
  /// In vi, this message translates to:
  /// **'30 ngày qua'**
  String get previous30Days;

  /// No description provided for @previous7Days.
  ///
  /// In vi, this message translates to:
  /// **'7 ngày qua'**
  String get previous7Days;

  /// No description provided for @profileTitle.
  ///
  /// In vi, this message translates to:
  /// **'Hồ sơ'**
  String get profileTitle;

  /// No description provided for @profileUpdated.
  ///
  /// In vi, this message translates to:
  /// **'Hồ sơ đã được cập nhật'**
  String get profileUpdated;

  /// No description provided for @progressLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tiến trình'**
  String get progressLabel;

  /// No description provided for @readAloudVietnamese.
  ///
  /// In vi, this message translates to:
  /// **'Đọc to (tiếng Việt)'**
  String get readAloudVietnamese;

  /// No description provided for @readyToLearnPrompt.
  ///
  /// In vi, this message translates to:
  /// **'Sẵn sàng học?'**
  String get readyToLearnPrompt;

  /// No description provided for @regenerateExercises.
  ///
  /// In vi, this message translates to:
  /// **'Tạo lại bài tập'**
  String get regenerateExercises;

  /// No description provided for @regenerateExercisesQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Tạo lại bài tập?'**
  String get regenerateExercisesQuestion;

  /// No description provided for @regenerateLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tạo lại'**
  String get regenerateLabel;

  /// No description provided for @regenerateResponseQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Tạo lại câu trả lời?'**
  String get regenerateResponseQuestion;

  /// No description provided for @registerSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Tham gia cùng chúng tôi'**
  String get registerSubtitle;

  /// No description provided for @registerTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tạo tài khoản'**
  String get registerTitle;

  /// No description provided for @removeButton.
  ///
  /// In vi, this message translates to:
  /// **'Xóa'**
  String get removeButton;

  /// No description provided for @removeFromCustomPracticeList.
  ///
  /// In vi, this message translates to:
  /// **'Xóa khỏi danh sách luyện tập tùy chỉnh'**
  String get removeFromCustomPracticeList;

  /// No description provided for @removeImage.
  ///
  /// In vi, this message translates to:
  /// **'Xóa hình ảnh'**
  String get removeImage;

  /// No description provided for @removeSavedWordContent.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc chắn muốn xóa từ này khỏi các từ đã lưu không?'**
  String get removeSavedWordContent;

  /// No description provided for @removeSavedWordTitle.
  ///
  /// In vi, this message translates to:
  /// **'Xóa từ đã lưu'**
  String get removeSavedWordTitle;

  /// No description provided for @replaceAllQuestionsAI.
  ///
  /// In vi, this message translates to:
  /// **'Thay thế tất cả câu hỏi bằng nội dung AI mới'**
  String get replaceAllQuestionsAI;

  /// No description provided for @resendButton.
  ///
  /// In vi, this message translates to:
  /// **'Gửi lại'**
  String get resendButton;

  /// No description provided for @resendCodeFailedMessage.
  ///
  /// In vi, this message translates to:
  /// **'Không thể gửi lại mã'**
  String get resendCodeFailedMessage;

  /// No description provided for @resetAllProgressQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại toàn bộ tiến độ?'**
  String get resetAllProgressQuestion;

  /// No description provided for @resetCodeDescription.
  ///
  /// In vi, this message translates to:
  /// **'Chúng tôi đã gửi mã 6 chữ số tới'**
  String get resetCodeDescription;

  /// No description provided for @resetCodeSentMessage.
  ///
  /// In vi, this message translates to:
  /// **'Mã đặt lại mới đã được gửi'**
  String get resetCodeSentMessage;

  /// No description provided for @resetConversation.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại cuộc trò chuyện'**
  String get resetConversation;

  /// No description provided for @resetCourseProgressWarning.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại toàn bộ tiến trình? Hành động này không thể hoàn tác. Tất cả tiến trình bài học, kết quả câu hỏi và bài tập tùy chỉnh sẽ bị xóa.'**
  String get resetCourseProgressWarning;

  /// No description provided for @resetLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại'**
  String get resetLabel;

  /// No description provided for @resetModuleProgressWarning.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại toàn bộ tiến trình? Hành động này không thể hoàn tác. Tất cả tiến trình bài học, kết quả câu hỏi và bài tập tùy chỉnh trong học phần này sẽ bị xóa.'**
  String get resetModuleProgressWarning;

  /// No description provided for @resetPasswordButton.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại mật khẩu'**
  String get resetPasswordButton;

  /// No description provided for @resetPasswordDescription.
  ///
  /// In vi, this message translates to:
  /// **'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một mã để đặt lại mật khẩu.'**
  String get resetPasswordDescription;

  /// No description provided for @resetPasswordTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại mật khẩu'**
  String get resetPasswordTitle;

  /// No description provided for @resetProgress.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại tiến độ'**
  String get resetProgress;

  /// No description provided for @resetProgressDataWarningDesc1.
  ///
  /// In vi, this message translates to:
  /// **'tiến trình, kết quả bài tập, dấu trang, mục tiêu hàng ngày và lịch sử trò chuyện AI. '**
  String get resetProgressDataWarningDesc1;

  /// No description provided for @resetProgressDataWarningDesc2.
  ///
  /// In vi, this message translates to:
  /// **'Tài khoản của bạn sẽ vẫn hoạt động nhưng bạn sẽ cần phải hoàn thành lại phần khảo sát ban đầu.'**
  String get resetProgressDataWarningDesc2;

  /// No description provided for @resetProgressQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại tiến độ?'**
  String get resetProgressQuestion;

  /// No description provided for @resetSessionButton.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại phiên'**
  String get resetSessionButton;

  /// No description provided for @resultHistory.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử kết quả'**
  String get resultHistory;

  /// No description provided for @resumeExerciseQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục bài tập?'**
  String get resumeExerciseQuestion;

  /// No description provided for @retryButton.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get retryButton;

  /// No description provided for @retryLoadingCategories.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại tải danh mục'**
  String get retryLoadingCategories;

  /// No description provided for @retryLoadingCourses.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại tải khóa học'**
  String get retryLoadingCourses;

  /// No description provided for @retryLoadingSimulationStats.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại tải thống kê mô phỏng'**
  String get retryLoadingSimulationStats;

  /// No description provided for @retryLoadingStats.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại tải thống kê'**
  String get retryLoadingStats;

  /// No description provided for @returnToPractice.
  ///
  /// In vi, this message translates to:
  /// **'Quay lại luyện tập'**
  String get returnToPractice;

  /// No description provided for @reviewConversation.
  ///
  /// In vi, this message translates to:
  /// **'Xem lại cuộc trò chuyện'**
  String get reviewConversation;

  /// No description provided for @reviewLessonBeforeRetry.
  ///
  /// In vi, this message translates to:
  /// **'Xem lại bài học trước khi thử lại'**
  String get reviewLessonBeforeRetry;

  /// No description provided for @saveFavoriteWordsDescription.
  ///
  /// In vi, this message translates to:
  /// **'Lưu các từ vựng yêu thích của bạn từ bài học'**
  String get saveFavoriteWordsDescription;

  /// No description provided for @saveFavoriteWordsDescription2.
  ///
  /// In vi, this message translates to:
  /// **'Lưu từ vựng yêu thích để học bằng thẻ ghi nhớ (flashcard)'**
  String get saveFavoriteWordsDescription2;

  /// No description provided for @saveLabel.
  ///
  /// In vi, this message translates to:
  /// **'Lưu'**
  String get saveLabel;

  /// No description provided for @savedWordsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Từ đã lưu'**
  String get savedWordsTitle;

  /// No description provided for @scenarioCategories.
  ///
  /// In vi, this message translates to:
  /// **'Danh mục tình huống'**
  String get scenarioCategories;

  /// No description provided for @scenariosTried.
  ///
  /// In vi, this message translates to:
  /// **'Tình huống đã thử'**
  String get scenariosTried;

  /// No description provided for @searchConversations.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm cuộc trò chuyện'**
  String get searchConversations;

  /// No description provided for @searchWordsOrMeaningsHint.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm từ hoặc nghĩa...'**
  String get searchWordsOrMeaningsHint;

  /// No description provided for @seeAll.
  ///
  /// In vi, this message translates to:
  /// **'Xem tất cả'**
  String get seeAll;

  /// No description provided for @seeSummary.
  ///
  /// In vi, this message translates to:
  /// **'Xem tóm tắt'**
  String get seeSummary;

  /// No description provided for @selectDialectTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chọn phương ngữ của bạn'**
  String get selectDialectTitle;

  /// No description provided for @selectGoalsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đặt mục tiêu hàng ngày'**
  String get selectGoalsTitle;

  /// No description provided for @selectLevelTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chọn trình độ của bạn'**
  String get selectLevelTitle;

  /// No description provided for @sendResetCodeButton.
  ///
  /// In vi, this message translates to:
  /// **'Gửi mã đặt lại'**
  String get sendResetCodeButton;

  /// No description provided for @sessionEndedMessage.
  ///
  /// In vi, this message translates to:
  /// **'Phiên đã kết thúc'**
  String get sessionEndedMessage;

  /// No description provided for @sessionPaused.
  ///
  /// In vi, this message translates to:
  /// **'Đã tạm dừng phiên'**
  String get sessionPaused;

  /// No description provided for @settingsButton.
  ///
  /// In vi, this message translates to:
  /// **'Cài đặt'**
  String get settingsButton;

  /// No description provided for @settingsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Cài đặt'**
  String get settingsTitle;

  /// No description provided for @shareLabel.
  ///
  /// In vi, this message translates to:
  /// **'Chia sẻ'**
  String get shareLabel;

  /// No description provided for @signInButton.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get signInButton;

  /// No description provided for @signInLink.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get signInLink;

  /// No description provided for @signUpButton.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký'**
  String get signUpButton;

  /// No description provided for @signUpLink.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký'**
  String get signUpLink;

  /// No description provided for @signUpPrompt.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có tài khoản?'**
  String get signUpPrompt;

  /// No description provided for @simulationResultTitle.
  ///
  /// In vi, this message translates to:
  /// **'Kết quả mô phỏng'**
  String get simulationResultTitle;

  /// No description provided for @skipLabel.
  ///
  /// In vi, this message translates to:
  /// **'Bỏ qua'**
  String get skipLabel;

  /// No description provided for @skipToExercisesButton.
  ///
  /// In vi, this message translates to:
  /// **'Bỏ qua đến bài tập'**
  String get skipToExercisesButton;

  /// No description provided for @sortBy.
  ///
  /// In vi, this message translates to:
  /// **'Sắp xếp theo'**
  String get sortBy;

  /// No description provided for @southernDialect.
  ///
  /// In vi, this message translates to:
  /// **'Miền Nam'**
  String get southernDialect;

  /// No description provided for @southernDialectDescription.
  ///
  /// In vi, this message translates to:
  /// **'Miền Nam Việt Nam (Thành phố Hồ Chí Minh)'**
  String get southernDialectDescription;

  /// No description provided for @speakingExercise.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập nói'**
  String get speakingExercise;

  /// No description provided for @standardDialect.
  ///
  /// In vi, this message translates to:
  /// **'Tiêu chuẩn'**
  String get standardDialect;

  /// No description provided for @standardDialectDescription.
  ///
  /// In vi, this message translates to:
  /// **'Tiêu chuẩn chung'**
  String get standardDialectDescription;

  /// No description provided for @startExercisesQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu bài tập?'**
  String get startExercisesQuestion;

  /// No description provided for @startFromBeginningButton.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu từ đầu'**
  String get startFromBeginningButton;

  /// No description provided for @startLabel.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu'**
  String get startLabel;

  /// No description provided for @startLearningButton.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu học'**
  String get startLearningButton;

  /// No description provided for @startNewChatToSeeHere.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu trò chuyện mới để xem tại đây'**
  String get startNewChatToSeeHere;

  /// No description provided for @startOver.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu lại'**
  String get startOver;

  /// No description provided for @stopLabel.
  ///
  /// In vi, this message translates to:
  /// **'Dừng'**
  String get stopLabel;

  /// No description provided for @studyLabel.
  ///
  /// In vi, this message translates to:
  /// **'Học'**
  String get studyLabel;

  /// No description provided for @submitLabel.
  ///
  /// In vi, this message translates to:
  /// **'Nộp bài'**
  String get submitLabel;

  /// No description provided for @successfullyUpdatedProfileLevelParam.
  ///
  /// In vi, this message translates to:
  /// **'Đã cập nhật trình độ hồ sơ thành công lên {level}!'**
  String successfullyUpdatedProfileLevelParam(Object level);

  /// No description provided for @systemTheme.
  ///
  /// In vi, this message translates to:
  /// **'Hệ thống'**
  String get systemTheme;

  /// No description provided for @takePhotoOption.
  ///
  /// In vi, this message translates to:
  /// **'Chụp ảnh'**
  String get takePhotoOption;

  /// No description provided for @tapToFlipBack.
  ///
  /// In vi, this message translates to:
  /// **'Nhấn để lật lại'**
  String get tapToFlipBack;

  /// No description provided for @thinking.
  ///
  /// In vi, this message translates to:
  /// **'Đang suy nghĩ...'**
  String get thinking;

  /// No description provided for @totalTime.
  ///
  /// In vi, this message translates to:
  /// **'Tổng thời gian'**
  String get totalTime;

  /// No description provided for @translateText.
  ///
  /// In vi, this message translates to:
  /// **'Dịch văn bản'**
  String get translateText;

  /// No description provided for @translationLabel.
  ///
  /// In vi, this message translates to:
  /// **'Dịch nghĩa'**
  String get translationLabel;

  /// No description provided for @tryDifferentSearchTerm.
  ///
  /// In vi, this message translates to:
  /// **'Thử tìm kiếm với từ khóa khác'**
  String get tryDifferentSearchTerm;

  /// No description provided for @typeAnswerHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập câu trả lời tại đây...'**
  String get typeAnswerHint;

  /// No description provided for @vietnameseWithoutDiacriticsAccepted.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có thể gõ tiếng Việt không dấu'**
  String get vietnameseWithoutDiacriticsAccepted;

  /// No description provided for @vietnameseWithoutDiacriticsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Việt Không Dấu'**
  String get vietnameseWithoutDiacriticsTitle;

  /// No description provided for @vietnameseWithoutDiacriticsExample.
  ///
  /// In vi, this message translates to:
  /// **'Ví dụ'**
  String get vietnameseWithoutDiacriticsExample;

  /// No description provided for @vietnameseWithoutDiacriticsExampleBefore.
  ///
  /// In vi, this message translates to:
  /// **'tieng viet'**
  String get vietnameseWithoutDiacriticsExampleBefore;

  /// No description provided for @vietnameseWithoutDiacriticsExampleAfter.
  ///
  /// In vi, this message translates to:
  /// **'tiếng việt'**
  String get vietnameseWithoutDiacriticsExampleAfter;

  /// No description provided for @understoodButton.
  ///
  /// In vi, this message translates to:
  /// **'Đã hiểu'**
  String get understoodButton;

  /// No description provided for @typeMessageHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập tin nhắn...'**
  String get typeMessageHint;

  /// No description provided for @typeWhatYouHearHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập những gì bạn nghe thấy...'**
  String get typeWhatYouHearHint;

  /// No description provided for @typeYourTranslationHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập bản dịch của bạn tại đây...'**
  String get typeYourTranslationHint;

  /// No description provided for @unableToCreateSessionMessage.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tạo phiên trò chuyện'**
  String get unableToCreateSessionMessage;

  /// No description provided for @unableToLoadBookmarkStats.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải thống kê dấu trang'**
  String get unableToLoadBookmarkStats;

  /// No description provided for @unableToLoadDataMessage.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải dữ liệu'**
  String get unableToLoadDataMessage;

  /// No description provided for @unableToLoadResultMessage.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải kết quả'**
  String get unableToLoadResultMessage;

  /// No description provided for @unexpectedErrorMessage.
  ///
  /// In vi, this message translates to:
  /// **'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'**
  String get unexpectedErrorMessage;

  /// No description provided for @unexpectedErrorMessage2.
  ///
  /// In vi, this message translates to:
  /// **'Đã xảy ra lỗi không mong muốn'**
  String get unexpectedErrorMessage2;

  /// No description provided for @unlockCustomPracticeCourseHint.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn thành ít nhất một học phần để mở khóa thực hành tùy chỉnh.'**
  String get unlockCustomPracticeCourseHint;

  /// No description provided for @unlockCustomPracticeModuleHint.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn thành ít nhất một bài học để mở khóa thực hành tùy chỉnh.'**
  String get unlockCustomPracticeModuleHint;

  /// No description provided for @updateLevel.
  ///
  /// In vi, this message translates to:
  /// **'Cập nhật trình độ'**
  String get updateLevel;

  /// No description provided for @uploadFromLibraryOption.
  ///
  /// In vi, this message translates to:
  /// **'Tải lên từ thư viện'**
  String get uploadFromLibraryOption;

  /// No description provided for @validEmailError.
  ///
  /// In vi, this message translates to:
  /// **'Nhập email hợp lệ'**
  String get validEmailError;

  /// No description provided for @verificationCodeSentMessage.
  ///
  /// In vi, this message translates to:
  /// **'Mã xác minh mới đã được gửi'**
  String get verificationCodeSentMessage;

  /// No description provided for @verificationFailedMessage.
  ///
  /// In vi, this message translates to:
  /// **'Xác minh thất bại'**
  String get verificationFailedMessage;

  /// No description provided for @verifyButton.
  ///
  /// In vi, this message translates to:
  /// **'Xác minh'**
  String get verifyButton;

  /// No description provided for @verifyCodeButton.
  ///
  /// In vi, this message translates to:
  /// **'Xác minh mã'**
  String get verifyCodeButton;

  /// No description provided for @verifyCodeFailedMessage.
  ///
  /// In vi, this message translates to:
  /// **'Không thể gửi lại mã'**
  String get verifyCodeFailedMessage;

  /// No description provided for @verifyingCodeMessage.
  ///
  /// In vi, this message translates to:
  /// **'Đang xác minh mã...'**
  String get verifyingCodeMessage;

  /// No description provided for @viewAttachedPhotosParam.
  ///
  /// In vi, this message translates to:
  /// **'Xem ảnh đã đính kèm ({count})'**
  String viewAttachedPhotosParam(Object count);

  /// No description provided for @viewResultsButton.
  ///
  /// In vi, this message translates to:
  /// **'Xem kết quả'**
  String get viewResultsButton;

  /// No description provided for @viewSavedWordsButton.
  ///
  /// In vi, this message translates to:
  /// **'Xem các từ đã lưu'**
  String get viewSavedWordsButton;

  /// No description provided for @viewScenario.
  ///
  /// In vi, this message translates to:
  /// **'Xem tình huống'**
  String get viewScenario;

  /// No description provided for @vocabularyTitle.
  ///
  /// In vi, this message translates to:
  /// **'Từ vựng'**
  String get vocabularyTitle;

  /// No description provided for @wordDetailsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chi tiết từ vựng'**
  String get wordDetailsTitle;

  /// No description provided for @wordRemovedToast.
  ///
  /// In vi, this message translates to:
  /// **'Đã xóa từ'**
  String get wordRemovedToast;

  /// No description provided for @wordSourceLabel.
  ///
  /// In vi, this message translates to:
  /// **'Nguồn từ'**
  String get wordSourceLabel;

  /// No description provided for @yourScoreLabel.
  ///
  /// In vi, this message translates to:
  /// **'Điểm số của bạn'**
  String get yourScoreLabel;

  /// No description provided for @yourTurn.
  ///
  /// In vi, this message translates to:
  /// **'Lượt của bạn'**
  String get yourTurn;

  /// No description provided for @noResponseLabel.
  ///
  /// In vi, this message translates to:
  /// **'_(không có phản hồi)_'**
  String get noResponseLabel;

  /// No description provided for @stoppedLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đã dừng'**
  String get stoppedLabel;

  /// No description provided for @copyLabel.
  ///
  /// In vi, this message translates to:
  /// **'Sao chép'**
  String get copyLabel;

  /// No description provided for @deleteConversationWarningParam.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc chắn muốn xóa cuộc trò chuyện \"{title}\"? Hành động này không thể hoàn tác.'**
  String deleteConversationWarningParam(Object title);

  /// No description provided for @conversationsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Cuộc trò chuyện'**
  String get conversationsTitle;

  /// No description provided for @chatCountParam.
  ///
  /// In vi, this message translates to:
  /// **'{count} cuộc trò chuyện'**
  String chatCountParam(num count);

  /// No description provided for @todayLabel.
  ///
  /// In vi, this message translates to:
  /// **'Hôm nay'**
  String get todayLabel;

  /// No description provided for @yesterdayLabel.
  ///
  /// In vi, this message translates to:
  /// **'Hôm qua'**
  String get yesterdayLabel;

  /// No description provided for @olderLabel.
  ///
  /// In vi, this message translates to:
  /// **'Cũ hơn'**
  String get olderLabel;

  /// No description provided for @minutesAgoParam.
  ///
  /// In vi, this message translates to:
  /// **'{count} phút trước'**
  String minutesAgoParam(num count);

  /// No description provided for @hoursAgoParam.
  ///
  /// In vi, this message translates to:
  /// **'{count} giờ trước'**
  String hoursAgoParam(num count);

  /// No description provided for @daysAgoParam.
  ///
  /// In vi, this message translates to:
  /// **'{count} ngày trước'**
  String daysAgoParam(num count);

  /// No description provided for @renameLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đổi tên'**
  String get renameLabel;

  /// No description provided for @sortNewest.
  ///
  /// In vi, this message translates to:
  /// **'Mới nhất'**
  String get sortNewest;

  /// No description provided for @sortOldest.
  ///
  /// In vi, this message translates to:
  /// **'Cũ nhất'**
  String get sortOldest;

  /// No description provided for @sortAZ.
  ///
  /// In vi, this message translates to:
  /// **'A-Z'**
  String get sortAZ;

  /// No description provided for @sortZA.
  ///
  /// In vi, this message translates to:
  /// **'Z-A'**
  String get sortZA;

  /// No description provided for @classifierDetailLabel.
  ///
  /// In vi, this message translates to:
  /// **'Bộ phân loại: {classifier}'**
  String classifierDetailLabel(Object classifier);

  /// No description provided for @filteringByScenario.
  ///
  /// In vi, this message translates to:
  /// **'Đang lọc theo tình huống'**
  String get filteringByScenario;

  /// No description provided for @clearFilter.
  ///
  /// In vi, this message translates to:
  /// **'Xóa bộ lọc'**
  String get clearFilter;

  /// No description provided for @tooManyErrorsLabel.
  ///
  /// In vi, this message translates to:
  /// **'Quá nhiều lỗi'**
  String get tooManyErrorsLabel;

  /// No description provided for @inappropriateContentLabel.
  ///
  /// In vi, this message translates to:
  /// **'Nội dung không phù hợp'**
  String get inappropriateContentLabel;

  /// No description provided for @abusiveContentLabel.
  ///
  /// In vi, this message translates to:
  /// **'Nội dung lạm dụng'**
  String get abusiveContentLabel;

  /// No description provided for @noResultsYet.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có kết quả'**
  String get noResultsYet;

  /// No description provided for @completeSimulationToSeeResults.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn thành cuộc trò chuyện mô phỏng để xem kết quả tại đây'**
  String get completeSimulationToSeeResults;

  /// No description provided for @defaultProfilePictureSemantics.
  ///
  /// In vi, this message translates to:
  /// **'Ảnh hồ sơ mặc định'**
  String get defaultProfilePictureSemantics;

  /// No description provided for @statisticsLabel.
  ///
  /// In vi, this message translates to:
  /// **'Thống kê'**
  String get statisticsLabel;

  /// No description provided for @simulationLabel.
  ///
  /// In vi, this message translates to:
  /// **'Mô phỏng'**
  String get simulationLabel;

  /// No description provided for @bookmarkedLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đã lưu'**
  String get bookmarkedLabel;

  /// No description provided for @sendVerificationCodeContinueParam.
  ///
  /// In vi, this message translates to:
  /// **'Chúng tôi sẽ gửi mã xác minh đến {email}. Tiếp tục?'**
  String sendVerificationCodeContinueParam(Object email);

  /// No description provided for @languageChinese.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Trung'**
  String get languageChinese;

  /// No description provided for @languageJapanese.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Nhật'**
  String get languageJapanese;

  /// No description provided for @languageKorean.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Hàn'**
  String get languageKorean;

  /// No description provided for @languageFrench.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Pháp'**
  String get languageFrench;

  /// No description provided for @languageGerman.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Đức'**
  String get languageGerman;

  /// No description provided for @languageSpanish.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Tây Ban Nha'**
  String get languageSpanish;

  /// No description provided for @appearanceLabel.
  ///
  /// In vi, this message translates to:
  /// **'Giao diện'**
  String get appearanceLabel;

  /// No description provided for @failedToLoadGoals.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải mục tiêu'**
  String get failedToLoadGoals;

  /// No description provided for @noGoalsSetYet.
  ///
  /// In vi, this message translates to:
  /// **'Chưa thiết lập mục tiêu nào'**
  String get noGoalsSetYet;

  /// No description provided for @addGoalToTrackProgress.
  ///
  /// In vi, this message translates to:
  /// **'Thêm mục tiêu để theo dõi tiến trình hàng ngày!'**
  String get addGoalToTrackProgress;

  /// No description provided for @goalReminders.
  ///
  /// In vi, this message translates to:
  /// **'Nhắc nhở mục tiêu'**
  String get goalReminders;

  /// No description provided for @reminderTime.
  ///
  /// In vi, this message translates to:
  /// **'Thời gian nhắc nhở'**
  String get reminderTime;

  /// No description provided for @unableToLoadScenarios.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải tình huống'**
  String get unableToLoadScenarios;

  /// No description provided for @startConversationPractice.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu luyện tập hội thoại'**
  String get startConversationPractice;

  /// No description provided for @startCourseLabel.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu khóa học'**
  String get startCourseLabel;

  /// No description provided for @beginLearningVietnameseToday.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu học tiếng Việt ngay hôm nay'**
  String get beginLearningVietnameseToday;

  /// No description provided for @continueLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục'**
  String get continueLabel;

  /// No description provided for @reviewLabel.
  ///
  /// In vi, this message translates to:
  /// **'Ôn tập'**
  String get reviewLabel;

  /// No description provided for @continueLessonTitleParam.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục bài học: {title}'**
  String continueLessonTitleParam(Object title);

  /// No description provided for @reviewLessonTitleParam.
  ///
  /// In vi, this message translates to:
  /// **'Ôn tập bài học: {title}'**
  String reviewLessonTitleParam(Object title);

  /// No description provided for @inappropriateContentEndMessage.
  ///
  /// In vi, this message translates to:
  /// **'Cuộc trò chuyện đã kết thúc do nội dung không phù hợp'**
  String get inappropriateContentEndMessage;

  /// No description provided for @overallScoreLabel.
  ///
  /// In vi, this message translates to:
  /// **'Điểm tổng quan'**
  String get overallScoreLabel;

  /// No description provided for @dialogueTitle.
  ///
  /// In vi, this message translates to:
  /// **'Hội thoại'**
  String get dialogueTitle;

  /// No description provided for @audioUnavailable.
  ///
  /// In vi, this message translates to:
  /// **'Âm thanh không khả dụng'**
  String get audioUnavailable;

  /// No description provided for @listenToDialogue.
  ///
  /// In vi, this message translates to:
  /// **'Nghe đoạn hội thoại'**
  String get listenToDialogue;

  /// No description provided for @promptOptionalLabel.
  ///
  /// In vi, this message translates to:
  /// **'Gợi ý (tùy chọn)'**
  String get promptOptionalLabel;

  /// No description provided for @describeFocusHint.
  ///
  /// In vi, this message translates to:
  /// **'Mô tả nội dung bạn muốn tập trung...'**
  String get describeFocusHint;

  /// No description provided for @creatingStatus.
  ///
  /// In vi, this message translates to:
  /// **'Đang tạo...'**
  String get creatingStatus;

  /// No description provided for @createQuestionsButton.
  ///
  /// In vi, this message translates to:
  /// **'Tạo bài tập'**
  String get createQuestionsButton;

  /// No description provided for @feedbackTitle.
  ///
  /// In vi, this message translates to:
  /// **'Phản hồi'**
  String get feedbackTitle;

  /// No description provided for @spellingLabel.
  ///
  /// In vi, this message translates to:
  /// **'Chính tả'**
  String get spellingLabel;

  /// No description provided for @congratulationsCompleteCourseParam.
  ///
  /// In vi, this message translates to:
  /// **'Chúc mừng bạn đã hoàn thành khóa học \"{title}\"! Bạn có muốn cập nhật cấp độ hồ sơ của mình thành {level} không?'**
  String congratulationsCompleteCourseParam(Object level, Object title);

  /// No description provided for @clearAnswersWarningParam.
  ///
  /// In vi, this message translates to:
  /// **'Câu trả lời của bạn cho \"{title}\" sẽ bị xóa sạch. Bạn có thể bắt đầu lại bất cứ lúc nào.'**
  String clearAnswersWarningParam(Object title);

  /// No description provided for @freshAiQuestionsWarningParam.
  ///
  /// In vi, this message translates to:
  /// **'Thao tác này sẽ tạo một bài tập mới thay thế \"{title}\" bằng các câu hỏi được tạo từ AI mới.'**
  String freshAiQuestionsWarningParam(Object title);

  /// No description provided for @quizLabel.
  ///
  /// In vi, this message translates to:
  /// **'Câu hỏi ngắn'**
  String get quizLabel;

  /// No description provided for @customPracticeLabel.
  ///
  /// In vi, this message translates to:
  /// **'Luyện tập tùy chỉnh'**
  String get customPracticeLabel;

  /// No description provided for @greatJobCompletedAllGoals.
  ///
  /// In vi, this message translates to:
  /// **'Làm tốt lắm! Bạn đã hoàn thành tất cả mục tiêu của ngày hôm nay!'**
  String get greatJobCompletedAllGoals;

  /// No description provided for @addPhotoFirst.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng thêm ảnh trước'**
  String get addPhotoFirst;

  /// No description provided for @unableToAnalyzeImage.
  ///
  /// In vi, this message translates to:
  /// **'Không thể phân tích hình ảnh. Vui lòng thử lại.'**
  String get unableToAnalyzeImage;

  /// No description provided for @unableToSaveVocabulary.
  ///
  /// In vi, this message translates to:
  /// **'Không thể lưu từ vựng. Vui lòng thử lại.'**
  String get unableToSaveVocabulary;

  /// No description provided for @analyzeImagesPrompt.
  ///
  /// In vi, this message translates to:
  /// **'Phân tích những hình ảnh này và giải thích nội dung hiển thị.'**
  String get analyzeImagesPrompt;

  /// No description provided for @findVocabularyPrompt.
  ///
  /// In vi, this message translates to:
  /// **'Tìm từ vựng tiếng Việt hữu ích trong các hình ảnh này.'**
  String get findVocabularyPrompt;

  /// No description provided for @translateTextPrompt.
  ///
  /// In vi, this message translates to:
  /// **'Dịch bất kỳ văn bản tiếng Việt nào xuất hiện trong các hình ảnh này.'**
  String get translateTextPrompt;

  /// No description provided for @explainContextPrompt.
  ///
  /// In vi, this message translates to:
  /// **'Giải thích ngữ cảnh và ý nghĩa của những hình ảnh này.'**
  String get explainContextPrompt;

  /// No description provided for @askAboutImageHint.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về hình ảnh này...'**
  String get askAboutImageHint;

  /// No description provided for @unfinishedProgressQuestionParam.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có tiến trình chưa hoàn thành ở câu hỏi số {current} trên {total}. Bạn muốn tiếp tục từ đó hay bắt đầu lại?'**
  String unfinishedProgressQuestionParam(Object current, Object total);

  /// No description provided for @noExercisesAvailable.
  ///
  /// In vi, this message translates to:
  /// **'Không có bài tập nào khả dụng'**
  String get noExercisesAvailable;

  /// No description provided for @questionProgressParam.
  ///
  /// In vi, this message translates to:
  /// **'Câu hỏi {current} trên {total}'**
  String questionProgressParam(Object current, Object total);

  /// No description provided for @incorrectLabel.
  ///
  /// In vi, this message translates to:
  /// **'Chưa chính xác'**
  String get incorrectLabel;

  /// No description provided for @correctAnswerLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đáp án đúng'**
  String get correctAnswerLabel;

  /// No description provided for @correctAnswerParam.
  ///
  /// In vi, this message translates to:
  /// **'Đáp án đúng: {answer}'**
  String correctAnswerParam(Object answer);

  /// No description provided for @stepProgressParam.
  ///
  /// In vi, this message translates to:
  /// **'Bước {current} trên {total}'**
  String stepProgressParam(Object current, Object total);

  /// No description provided for @finishedContentPracticeQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Bạn đã học xong nội dung bài học. Bạn có muốn luyện tập bằng bài tập không?'**
  String get finishedContentPracticeQuestion;

  /// No description provided for @readingStepLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đọc'**
  String get readingStepLabel;

  /// No description provided for @imageStepLabel.
  ///
  /// In vi, this message translates to:
  /// **'Hình ảnh'**
  String get imageStepLabel;

  /// No description provided for @videoStepLabel.
  ///
  /// In vi, this message translates to:
  /// **'Video'**
  String get videoStepLabel;

  /// No description provided for @contentStepLabel.
  ///
  /// In vi, this message translates to:
  /// **'Nội dung'**
  String get contentStepLabel;

  /// No description provided for @configureCustomPractice.
  ///
  /// In vi, this message translates to:
  /// **'Cấu hình luyện tập tùy chỉnh'**
  String get configureCustomPractice;

  /// No description provided for @numberOfQuestionsParam.
  ///
  /// In vi, this message translates to:
  /// **'Số lượng câu hỏi: {count}'**
  String numberOfQuestionsParam(Object count);

  /// No description provided for @questionTypesLabel.
  ///
  /// In vi, this message translates to:
  /// **'Các dạng bài tập'**
  String get questionTypesLabel;

  /// No description provided for @focusLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tập trung'**
  String get focusLabel;

  /// No description provided for @startPracticeLabel.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu luyện tập'**
  String get startPracticeLabel;

  /// No description provided for @continuePracticeLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục luyện tập'**
  String get continuePracticeLabel;

  /// No description provided for @practiceAgainLabel.
  ///
  /// In vi, this message translates to:
  /// **'Luyện tập lại'**
  String get practiceAgainLabel;

  /// No description provided for @passwordLengthError.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu phải dài ít nhất 8 ký tự'**
  String get passwordLengthError;

  /// No description provided for @passwordComplexityError.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu phải chứa chữ hoa, chữ thường và chữ số'**
  String get passwordComplexityError;

  /// No description provided for @googleTokenFailed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể lấy mã thông báo Google ID'**
  String get googleTokenFailed;

  /// No description provided for @generateAiExercisesTailored.
  ///
  /// In vi, this message translates to:
  /// **'Tạo các bài tập được hỗ trợ bởi AI phù hợp với nhu cầu của bạn'**
  String get generateAiExercisesTailored;

  /// No description provided for @analyzingStatus.
  ///
  /// In vi, this message translates to:
  /// **'Đang phân tích...'**
  String get analyzingStatus;

  /// No description provided for @submittingStatus.
  ///
  /// In vi, this message translates to:
  /// **'Đang gửi...'**
  String get submittingStatus;

  /// No description provided for @correctLabel.
  ///
  /// In vi, this message translates to:
  /// **'Chính xác!'**
  String get correctLabel;

  /// No description provided for @unableToLoadImage.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải hình ảnh'**
  String get unableToLoadImage;

  /// No description provided for @maxImagesAnalysisWarning.
  ///
  /// In vi, this message translates to:
  /// **'Bạn chỉ có thể phân tích tối đa 5 hình ảnh cùng một lúc'**
  String get maxImagesAnalysisWarning;

  /// No description provided for @practiceWithLesson.
  ///
  /// In vi, this message translates to:
  /// **'Luyện tập theo bài học'**
  String get practiceWithLesson;

  /// No description provided for @pointsParam.
  ///
  /// In vi, this message translates to:
  /// **'+{points} điểm'**
  String pointsParam(Object points);

  /// No description provided for @examplesTitle.
  ///
  /// In vi, this message translates to:
  /// **'Ví dụ'**
  String get examplesTitle;

  /// No description provided for @profilePictureOfParam.
  ///
  /// In vi, this message translates to:
  /// **'Ảnh hồ sơ của {name}'**
  String profilePictureOfParam(Object name);

  /// No description provided for @failedToLoadSimulationStats.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải số liệu thống kê mô phỏng'**
  String get failedToLoadSimulationStats;

  /// No description provided for @filtersTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bộ lọc'**
  String get filtersTitle;

  /// No description provided for @characterNameParam.
  ///
  /// In vi, this message translates to:
  /// **'Nhân vật: {name}'**
  String characterNameParam(Object name);

  /// No description provided for @learnVietnamese.
  ///
  /// In vi, this message translates to:
  /// **'Học tiếng Việt'**
  String get learnVietnamese;

  /// No description provided for @todaysProgress.
  ///
  /// In vi, this message translates to:
  /// **'Tiến trình hôm nay'**
  String get todaysProgress;

  /// No description provided for @languageThai.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Thái'**
  String get languageThai;

  /// No description provided for @youLabel.
  ///
  /// In vi, this message translates to:
  /// **'Bạn'**
  String get youLabel;

  /// No description provided for @levelA1.
  ///
  /// In vi, this message translates to:
  /// **'Mới bắt đầu'**
  String get levelA1;

  /// No description provided for @levelA2.
  ///
  /// In vi, this message translates to:
  /// **'Cơ bản'**
  String get levelA2;

  /// No description provided for @levelB1.
  ///
  /// In vi, this message translates to:
  /// **'Trung cấp'**
  String get levelB1;

  /// No description provided for @levelB2.
  ///
  /// In vi, this message translates to:
  /// **'Trên trung cấp'**
  String get levelB2;

  /// No description provided for @levelC1.
  ///
  /// In vi, this message translates to:
  /// **'Cao cấp'**
  String get levelC1;

  /// No description provided for @levelC2.
  ///
  /// In vi, this message translates to:
  /// **'Thành thạo'**
  String get levelC2;

  /// No description provided for @practiceWithLessonDesc.
  ///
  /// In vi, this message translates to:
  /// **'Luyện tập với các bài tập tích hợp sẵn của bài học'**
  String get practiceWithLessonDesc;

  /// No description provided for @onboardingSelectNativeLanguageTitle.
  ///
  /// In vi, this message translates to:
  /// **'Ngôn ngữ mẹ đẻ của bạn là gì?'**
  String get onboardingSelectNativeLanguageTitle;

  /// No description provided for @onboardingSelectNativeLanguageDescription.
  ///
  /// In vi, this message translates to:
  /// **'Chúng tôi sẽ dùng thông tin này để cá nhân hóa phản hồi AI cho bạn.'**
  String get onboardingSelectNativeLanguageDescription;

  /// No description provided for @passwordRuleMinLength.
  ///
  /// In vi, this message translates to:
  /// **'Ít nhất 12 ký tự'**
  String get passwordRuleMinLength;

  /// No description provided for @passwordRuleLowercase.
  ///
  /// In vi, this message translates to:
  /// **'Có chữ thường (a-z)'**
  String get passwordRuleLowercase;

  /// No description provided for @passwordRuleUppercase.
  ///
  /// In vi, this message translates to:
  /// **'Có chữ hoa (A-Z)'**
  String get passwordRuleUppercase;

  /// No description provided for @passwordRuleNumber.
  ///
  /// In vi, this message translates to:
  /// **'Có chữ số (0-9)'**
  String get passwordRuleNumber;

  /// No description provided for @passwordRuleSpecial.
  ///
  /// In vi, this message translates to:
  /// **'Có ký tự đặc biệt (!@#\$%)'**
  String get passwordRuleSpecial;

  /// No description provided for @passwordRuleNoSpace.
  ///
  /// In vi, this message translates to:
  /// **'Không có khoảng trắng'**
  String get passwordRuleNoSpace;

  /// No description provided for @passwordRuleNotCommon.
  ///
  /// In vi, this message translates to:
  /// **'Không phải mật khẩu dễ đoán'**
  String get passwordRuleNotCommon;

  /// No description provided for @passwordStrengthWeak.
  ///
  /// In vi, this message translates to:
  /// **'Yếu'**
  String get passwordStrengthWeak;

  /// No description provided for @passwordStrengthMedium.
  ///
  /// In vi, this message translates to:
  /// **'Trung bình'**
  String get passwordStrengthMedium;

  /// No description provided for @passwordStrengthStrong.
  ///
  /// In vi, this message translates to:
  /// **'Mạnh'**
  String get passwordStrengthStrong;

  /// No description provided for @passwordRequirementsNotMet.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu chưa đáp ứng yêu cầu bảo mật'**
  String get passwordRequirementsNotMet;

  /// No description provided for @assistantBookmarksTitle.
  ///
  /// In vi, this message translates to:
  /// **'Từ đã lưu'**
  String get assistantBookmarksTitle;

  /// No description provided for @assistantBookmarksPlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về từ đã lưu?'**
  String get assistantBookmarksPlaceholder;

  /// No description provided for @assistantFlashcardTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thẻ ghi nhớ'**
  String get assistantFlashcardTitle;

  /// No description provided for @assistantFlashcardPlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về thẻ này?'**
  String get assistantFlashcardPlaceholder;

  /// No description provided for @assistantCourseTitle.
  ///
  /// In vi, this message translates to:
  /// **'Khóa học'**
  String get assistantCourseTitle;

  /// No description provided for @assistantCourseTitleParam.
  ///
  /// In vi, this message translates to:
  /// **'Khóa học · {title}'**
  String assistantCourseTitleParam(Object title);

  /// No description provided for @assistantCoursePlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về khóa học này?'**
  String get assistantCoursePlaceholder;

  /// No description provided for @assistantModuleTitle.
  ///
  /// In vi, this message translates to:
  /// **'Mô-đun'**
  String get assistantModuleTitle;

  /// No description provided for @assistantModuleTitleParam.
  ///
  /// In vi, this message translates to:
  /// **'Mô-đun · {title}'**
  String assistantModuleTitleParam(Object title);

  /// No description provided for @assistantModulePlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về mô-đun này?'**
  String get assistantModulePlaceholder;

  /// No description provided for @assistantLessonTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bài học'**
  String get assistantLessonTitle;

  /// No description provided for @assistantLessonTitleParam.
  ///
  /// In vi, this message translates to:
  /// **'Bài học · {title}'**
  String assistantLessonTitleParam(Object title);

  /// No description provided for @assistantLessonPlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về bài học này?'**
  String get assistantLessonPlaceholder;

  /// No description provided for @assistantPracticeTitle.
  ///
  /// In vi, this message translates to:
  /// **'Luyện tập'**
  String get assistantPracticeTitle;

  /// No description provided for @assistantPracticeTitleParam.
  ///
  /// In vi, this message translates to:
  /// **'Luyện tập · {title}'**
  String assistantPracticeTitleParam(Object title);

  /// No description provided for @assistantPracticePlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về luyện tập?'**
  String get assistantPracticePlaceholder;

  /// No description provided for @assistantExerciseTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bài tập'**
  String get assistantExerciseTitle;

  /// No description provided for @assistantExercisePlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Cần gợi ý không?'**
  String get assistantExercisePlaceholder;

  /// No description provided for @assistantScenarioTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tình huống'**
  String get assistantScenarioTitle;

  /// No description provided for @assistantScenarioTitleParam.
  ///
  /// In vi, this message translates to:
  /// **'Tình huống · {title}'**
  String assistantScenarioTitleParam(Object title);

  /// No description provided for @assistantScenarioPlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về tình huống này?'**
  String get assistantScenarioPlaceholder;

  /// No description provided for @assistantResultTitle.
  ///
  /// In vi, this message translates to:
  /// **'Kết quả mô phỏng'**
  String get assistantResultTitle;

  /// No description provided for @assistantResultTitleParam.
  ///
  /// In vi, this message translates to:
  /// **'Kết quả · {title}'**
  String assistantResultTitleParam(Object title);

  /// No description provided for @assistantResultPlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về kết quả này?'**
  String get assistantResultPlaceholder;

  /// No description provided for @assistantHistoryTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử trò chuyện'**
  String get assistantHistoryTitle;

  /// No description provided for @assistantHistoryFilteredTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử · tình huống'**
  String get assistantHistoryFilteredTitle;

  /// No description provided for @assistantHistoryPlaceholder.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về lịch sử của bạn?'**
  String get assistantHistoryPlaceholder;
}

class _SDelegate extends LocalizationsDelegate<S> {
  const _SDelegate();

  @override
  Future<S> load(Locale locale) {
    return SynchronousFuture<S>(lookupS(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'de',
    'en',
    'es',
    'fr',
    'ja',
    'ko',
    'th',
    'vi',
    'zh',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_SDelegate old) => false;
}

S lookupS(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'de':
      return SDe();
    case 'en':
      return SEn();
    case 'es':
      return SEs();
    case 'fr':
      return SFr();
    case 'ja':
      return SJa();
    case 'ko':
      return SKo();
    case 'th':
      return STh();
    case 'vi':
      return SVi();
    case 'zh':
      return SZh();
  }

  throw FlutterError(
    'S.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
