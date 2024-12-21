import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '@common/decorators';
import { Role, User } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { UserService } from './user.service';
import { UserResponse } from './responses';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Retrieve a list of users
   */
  @Get('list')
  @ApiOperation({ summary: 'Get list of users' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [UserResponse],
  })
  @UseInterceptors(ClassSerializerInterceptor)
  async getUsers() {
    const users = await this.userService.findMany();
    return users.map((user) => new UserResponse(user));
  }

  /**
   * Retrieve a user by ID or email
   */
  @ApiOperation({ summary: 'Get user by ID or email' })
  @ApiParam({ name: 'identifier', description: 'ID or email of the user' })
  @ApiResponse({
    status: 200,
    description: 'User',
    type: UserResponse,
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':identifier')
  async findOneUser(
    @Param('identifier') identifier: string,
  ): Promise<UserResponse> {
    const user = await this.userService.findOne(identifier);
    return new UserResponse(user);
  }

  /**
   * Update user details.
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update user' })
  @ApiBody({
    description: 'Data for updating user',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: UserResponse,
  })
  @ApiBearerAuth()
  @Put()
  async updateUser(@Body() body: Partial<User>) {
    const user = await this.userService.save(body);
    return new UserResponse(user);
  }

  /**
   * Delete user by ID
   */
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'ID of the user', type: String })
  @ApiResponse({
    status: 200,
    description: 'User deleted',
    type: UserResponse,
  })
  @Delete(':id')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.delete(id);
  }
}
