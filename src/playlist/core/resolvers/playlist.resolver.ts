import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Info,
  Context,
} from '@nestjs/graphql';
import { PlaylistService } from '../services/playlist.service';
import { Playlist } from '../../entities/playlist.entity';
import {
  ConvertedPlaylist,
  PlaylistJSON,
  MutatePlaylistInput,
  AuthRequiredResponse,
  ConvertPlaylistResponse,
} from 'src/playlist/common/dto/playlists.dto';
import { CurrentUser } from 'src/global/decorators/current-user';
import {
  ForbiddenException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { UserInput } from 'src/user/dto/user.input';
import { PlaylistsResponse } from 'src/playlist/common/dto/playlists.dto';
import { GraphQLResolveInfo } from 'graphql';
import { Auth, RequireOAuth } from 'src/global/decorators/auth.decorator';
import { ApiDomain } from 'src/auth/common/enums/api-domain.enum';
import { AuthLevel } from 'src/auth/common/enums/auth-level.enum';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';
import { GqlContext } from 'src/auth/common/interfaces/context.interface';
import { SpotifyAuthService } from 'src/auth/providers/spotify/spotify-auth.service';
import { UseInterceptors } from '@nestjs/common';
import { OAuthInterceptor } from 'src/auth/core/interceptors/oauth.interceptor';
import { PlatformError } from 'src/playlist/common/errors/platform.errors';
import { OAuthErrorInterceptor } from 'src/auth/core/interceptors/oauth-error.interceptor';
import {
  OAuthenticationError,
  OAuthorizationError,
} from 'src/auth/common/errors/oauth.errors';
import { OAuth2TokenResponse } from 'src/auth/common/interfaces/oauth.interface';
@Resolver(() => Playlist)
export class PlaylistResolver {
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private retryAttempts = new Map<
    string,
    { count: number; inProgress: boolean }
  >();

  constructor(
    @Inject()
    private readonly playlistService: PlaylistService,
    @Inject()
    private readonly googleAuthService: GoogleAuthService,
    @Inject()
    private readonly spotifyAuthService: SpotifyAuthService,
  ) {}

  @Mutation(() => Boolean)
  async savePlaylist(
    @CurrentUser() user: UserInput,
    @Args('mutatePlaylistInput') mutatePlaylistInput: MutatePlaylistInput,
  ) {
    if (user === undefined || user.id === undefined) {
      throw new ForbiddenException();
    }
    await this.playlistService.create(mutatePlaylistInput, user.id);
    return true;
  }

  @Mutation(() => Boolean)
  async updatePlaylist(
    @CurrentUser() user: UserInput,
    @Args('mutatePlaylistInput') mutatePlaylistInput: MutatePlaylistInput,
  ) {
    if (user === undefined || user.id === undefined) {
      throw new ForbiddenException();
    }
    if (mutatePlaylistInput.id === undefined) {
      throw new BadRequestException('id is required');
    }
    const result = await this.playlistService.update(
      mutatePlaylistInput.id,
      user.id,
      mutatePlaylistInput,
    );
    return result;
  }

  @Query(() => PlaylistsResponse, { name: 'playlistsPage' })
  async findAll(
    @CurrentUser() user: UserInput,
    @Args('page', { type: () => Int }) page: number,
    @Args('limit', { type: () => Int }) limit: number,
    @Args('orderBy', { type: () => String }) orderBy: string,
    @Info() info: GraphQLResolveInfo,
  ) {
    if (user.id === undefined) {
      console.log('user.id is undefined');
      throw new ForbiddenException();
    }

    const selections = info.fieldNodes[0].selectionSet?.selections || [];
    const playlistFields = new Set<string>();

    selections.forEach((selection) => {
      if (selection.kind === 'Field' && selection.name.value === 'playlists') {
        selection.selectionSet?.selections.forEach((field) => {
          if (field.kind === 'Field') {
            playlistFields.add(field.name.value);
          }
        });
      }
    });

    return await this.playlistService.findAll(
      user.id,
      page,
      limit,
      orderBy,
      Array.from(playlistFields),
    );
  }

  @Auth(AuthLevel.NONE)
  @Query(() => Playlist, { name: 'playlist' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Info() info: GraphQLResolveInfo,
  ) {
    const selections = info.fieldNodes[0].selectionSet?.selections || [];
    const playlistFields = new Set<string>();

    selections.forEach((selection) => {
      if (selection.kind === 'Field' && selection.name.value === 'playlist') {
        selection.selectionSet?.selections.forEach((field) => {
          if (field.kind === 'Field') {
            playlistFields.add(field.name.value);
          }
        });
      }
    });
    return await this.playlistService.findOne(id, Array.from(playlistFields));
  }

  @Mutation(() => Boolean)
  async removePlaylist(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: UserInput,
  ) {
    if (user === undefined || user.id === undefined) {
      throw new ForbiddenException();
    }
    return await this.playlistService.remove(id, user.id);
  }

  @Auth(AuthLevel.NONE)
  @Mutation(() => [PlaylistJSON])
  async readPlaylist(@Args('link', { type: () => String }) link: string) {
    try {
      return await this.playlistService.read(link);
    } catch (error) {
      if (error.message.includes('Playlist not found')) {
        throw new PlatformError('PLAYLIST_NOT_FOUND');
      }
      throw error;
    }
  }

  /**
   * @param listJSON
   * @param context
   * @returns ConvertedPlaylist
   * @description
   * 1. get accessToken from context - if logged in, get accessToken from cookie
   * 2. convert to spotify playlist - if logged in, it can retry with new accessToken
   * 3. if success, return ConvertedPlaylist
   */
  @Auth(AuthLevel.OPTIONAL)
  @RequireOAuth(ApiDomain.SPOTIFY)
  @UseInterceptors(OAuthInterceptor, OAuthErrorInterceptor)
  @Mutation(() => ConvertPlaylistResponse)
  async convertToSpotifyPlaylist(
    @Context() ctx: GqlContext,
    @CurrentUser() user: UserInput,
    @Args('listJSON', { type: () => [PlaylistJSON] })
    listJSON: PlaylistJSON[],
    @Args('state', { type: () => String, nullable: true })
    state?: string,
    @Args('authorizationCode', { type: () => String, nullable: true })
    authorizationCode?: string,
  ): Promise<ConvertedPlaylist | AuthRequiredResponse> {
    try {
      const apiAccessToken = ctx.req.api_accessToken;

      return await this.playlistService.convertToSpotifyPlaylist(
        user?.id || null,
        apiAccessToken,
        listJSON,
      );
    } catch (error) {
      return this.handleConversionError(
        error,
        user,
        ctx,
        ApiDomain.SPOTIFY,
        () => this.spotifyAuthService.refreshAccessToken(user.id),
        () =>
          this.convertToSpotifyPlaylist(
            ctx,
            user,
            listJSON,
            state,
            authorizationCode,
          ),
      );
    }
  }

  /**
   * @param listJSON
   * @param ctx
   * @returns ConvertedPlaylist
   * @description
   * 1. get accessToken from context - if logged in, get accessToken from cookie
   * 2. convert to youtube playlist - if logged in, it can retry with new accessToken
   * 3. if success, return ConvertedPlaylist
   */
  @Auth(AuthLevel.OPTIONAL)
  @RequireOAuth(ApiDomain.YOUTUBE)
  @UseInterceptors(OAuthInterceptor, OAuthErrorInterceptor)
  @Mutation(() => ConvertPlaylistResponse)
  async convertToYoutubePlaylist(
    @Context() ctx: GqlContext,
    @CurrentUser() user: UserInput,
    @Args('listJSON', { type: () => [PlaylistJSON] })
    listJSON: PlaylistJSON[],
    @Args('state', { type: () => String, nullable: true })
    state?: string,
    @Args('authorizationCode', { type: () => String, nullable: true })
    authorizationCode?: string,
  ): Promise<ConvertedPlaylist | AuthRequiredResponse> {
    console.log('--- playlist resolver convertToYoutubePlaylist ---');
    try {
      const apiAccessToken = ctx.req.api_accessToken;
      console.log('apiAccessToken', apiAccessToken);

      return await this.playlistService.convertToYoutubePlaylist(
        user?.id || null,
        apiAccessToken,
        listJSON,
      );
    } catch (error) {
      return this.handleConversionError(
        error,
        user,
        ctx,
        ApiDomain.YOUTUBE,
        () => this.googleAuthService.refreshAccessToken(user.id),
        () =>
          this.convertToYoutubePlaylist(
            ctx,
            user,
            listJSON,
            state,
            authorizationCode,
          ),
      );
    }
  }

  /**
   * @description
   * 1. set accessToken to context
   * @param ctx
   * @param accessToken
   */
  private setAccessTokenToContext(ctx: GqlContext, accessToken: string) {
    ctx.req.api_accessToken = accessToken;
  }

  /**
   * @description
   * 1. if error is OAuthenticationError, retry with new accessToken
   * 2. if error is PlatformError, throw BadRequestException
   * 3. if error is other, throw error
   * @param error
   * @param user
   * @param ctx
   * @param apiDomain
   * @param refreshTokenFn
   * @param retryFn
   * @returns ConvertedPlaylist | AuthRequiredResponse
   */
  private async handleConversionError(
    error: any,
    user: UserInput,
    ctx: GqlContext,
    apiDomain: ApiDomain,
    refreshTokenFn: () => Promise<OAuth2TokenResponse>,
    retryFn: () => Promise<ConvertedPlaylist | AuthRequiredResponse>,
  ): Promise<ConvertedPlaylist | AuthRequiredResponse> {
    console.log('--- handleConversionError ---');
    if (error instanceof OAuthenticationError) {
      if (!user?.id) {
        throw new OAuthorizationError(error.message);
      }

      const key = `${user.id}:${apiDomain}`;
      if (!this.retryAttempts.has(key)) {
        this.retryAttempts.set(key, { count: 0, inProgress: false });
      }

      const attempt = this.retryAttempts.get(key)!;

      if (attempt.count >= this.MAX_RETRY_ATTEMPTS) {
        throw new OAuthorizationError(
          `Failed to refresh access token after ${this.MAX_RETRY_ATTEMPTS} attempts`,
        );
      }

      if (attempt.inProgress) {
        throw new OAuthorizationError(
          'Authentication retry is already in progress',
        );
      }

      try {
        attempt.inProgress = true;
        attempt.count += 1;

        const tokenResponse = await refreshTokenFn();

        this.setAccessTokenToContext(ctx, tokenResponse.access_token);

        return await retryFn();
      } catch (retryError) {
        throw new OAuthorizationError(
          `Failed to refresh access token: ${retryError.message}`,
        );
      } finally {
        attempt.inProgress = false;
      }
    }

    if (error instanceof PlatformError) {
      throw new BadRequestException(error.message);
    }

    throw error;
  }
}
