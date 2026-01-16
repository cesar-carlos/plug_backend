import { SQLiteUserRepository } from "../../infrastructure/repositories/sqlite_user.repository";
import { SQLiteRefreshTokenRepository } from "../../infrastructure/repositories/sqlite_refresh_token.repository";
import { BcryptPasswordHasher } from "../utils/bcrypt_password_hasher";
import { LoginUseCase } from "../../domain/use_cases/login.use_case";
import { RegisterUseCase } from "../../domain/use_cases/register.use_case";
import { RefreshTokenUseCase } from "../../domain/use_cases/refresh_token.use_case";
import { SendChatMessageUseCase } from "../../domain/use_cases/send_chat_message.use_case";
import { AuthService } from "../../application/services/auth.service";
import { ChatService } from "../../application/services/chat.service";
import { createAuthController } from "../../presentation/controllers/auth.controller";
import { createChatHandler } from "../../presentation/handlers/chat.handler";

export class Container {
  private _userRepository = new SQLiteUserRepository();
  get userRepository() {
    return this._userRepository;
  }

  private _passwordHasher = new BcryptPasswordHasher();
  get passwordHasher() {
    return this._passwordHasher;
  }

  private _loginUseCase = new LoginUseCase(
    this.userRepository,
    this.passwordHasher
  );
  get loginUseCase() {
    return this._loginUseCase;
  }

  private _registerUseCase = new RegisterUseCase(
    this.userRepository,
    this.passwordHasher
  );
  get registerUseCase() {
    return this._registerUseCase;
  }

  private _refreshTokenRepository = new SQLiteRefreshTokenRepository();
  get refreshTokenRepository() {
    return this._refreshTokenRepository;
  }

  private _refreshTokenUseCase = new RefreshTokenUseCase(
    this.refreshTokenRepository,
    this.userRepository
  );
  get refreshTokenUseCase() {
    return this._refreshTokenUseCase;
  }

  private _sendChatMessageUseCase = new SendChatMessageUseCase();
  get sendChatMessageUseCase() {
    return this._sendChatMessageUseCase;
  }

  private _authService = new AuthService(
    this.loginUseCase,
    this.registerUseCase,
    this.refreshTokenUseCase,
    this.refreshTokenRepository
  );
  get authService() {
    return this._authService;
  }

  private _chatService = new ChatService(this.sendChatMessageUseCase);
  get chatService() {
    return this._chatService;
  }

  get authController() {
    return createAuthController(this.authService);
  }

  get chatHandler() {
    return createChatHandler(this.chatService);
  }
}

export const container = new Container();
