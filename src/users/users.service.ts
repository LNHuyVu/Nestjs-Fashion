import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userTypes } from 'src/shared/schema/users';
import config from 'config';
import { UserRepository } from 'src/shared/repositories/user.repository';
import {
  comparePassword,
  generateHashPassword,
} from 'src/shared/utility/password-manager';
import { generateAuthToken } from 'src/shared/utility/token-generator';
import { IsDataURI } from 'class-validator';
import { MailService } from 'src/emails/email.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UserRepository) private readonly userDB: UserRepository,
    private readonly mailService: MailService, // Inject AppService vào đây
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      // create the hash password
      createUserDto.password = await generateHashPassword(
        createUserDto.password,
      );
      //Check admin
      if (
        createUserDto.type === userTypes.ADMIN &&
        createUserDto.secretToken === config.get('adminSecretToken')
      ) {
        throw new Error('Not allowed to create admin');
      } else if (createUserDto.type !== userTypes.CUSTOMER) {
        createUserDto.isVerified = true;
      }
      //User is already exits
      const user = await this.userDB.findOne({
        email: createUserDto.email,
      });
      if (user) {
        throw new Error('User already exists');
      }

      //Generate the otp
      const otp = Math.floor(Math.random() * 900000) + 100000;
      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

      const newUser = await this.userDB.create({
        ...createUserDto,
        otp,
        otpExpiryTime,
      });
      if (newUser.type !== userTypes.ADMIN) {
        // sendEmail();
      }
      return {
        success: true,
        message:
          newUser.type === userTypes.ADMIN
            ? 'Admin created successfully'
            : 'Please activate your account by verifyiing your email. We have sent you a email with the otp',
        result: { email: newUser.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(type: string) {
    try {
      console.log({ type });
      const users = await this.userDB.find({
        type,
      });
      console.log(users);
      return {
        success: true,
        message: 'Users fetched successfully',
        result: users,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.userDB.findOne({ _id: id });
      return {
        success: true,
        message: 'Get user successfully',
        result: user,
      };
    } catch (error) {
      throw error;
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
  async login(email: string, password: string) {
    try {
      const userExits = await this.userDB.findOne({
        email,
      });
      if (!userExits) {
        throw new Error('Invalid email or password');
      }
      if (!userExits.isVerified) {
        throw new Error('Please verify your email');
      }
      const isPasswordMatch = await comparePassword(
        password,
        userExits.password,
      );
      if (!isPasswordMatch) {
        throw new Error('Invalid email or password');
      }
      const token = await generateAuthToken(userExits._id as string);
      console.log('token', token);
      return {
        success: true,
        message: 'Log successfully',
        result: {
          user: {
            name: userExits.name,
            email: userExits.email,
            type: userExits.type,
            id: userExits._id.toString(),
          },
          token,
        },
      };
    } catch (error) {
      throw error;
    }
  }
  /**
   *
   */
  async verifyEmail(otp: string, email: string) {
    try {
      console.log('service', otp, email);
      const user = await this.userDB.findOne({
        email: email,
      });
      console.log('user', user);
      if (user.otp !== otp) {
        throw new Error('Invalid otp');
      }
      if (user.otpExpiryTime < new Date()) {
        throw new Error('Otp expired');
      }
      await this.userDB.updateOne({ email }, { isVerified: true });
      return {
        success: true,
        message: 'Email verified successfully. You can login now.',
      };
    } catch (error) {
      throw error;
    }
  }
  /**
   *
   */
  async sendOtpEmail(email: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not found');
      }
      if (user.isVerified) {
        throw new Error('Email already verified');
      }
      const otp = Math.floor(Math.random() * 900000) + 100000;
      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);
      await this.userDB.updateOne({ email }, { otp, otpExpiryTime });
      //
      // sendEmail(user.email, config.get('emailService'));
      // send link otp/email
      //
      return {
        success: true,
        message: 'Otp sent successfully',
        return: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }
  /**
   *
   */
  async forgotPassword(email: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not found');
      }
      let password = Math.random().toString(36).substring(2, 12);
      const passwordSend = password;
      password = await generateHashPassword(password);
      await this.userDB.updateOne({ _id: user._id }, { password });
      // send email
      // send new password
      // send link login
      const subject = 'Welcome to our service';
      const templateName = 'welcome';
      const to = 'majexif487@bacaki.com';
      const variables = {
        name: 'Jack',
        username: 'J97',
      };
      await this.mailService.sendMail(to, subject, templateName, variables);
      //
      return {
        success: true,
        message: 'Password sent successfully',
        result: { email: user.email, passwordSend },
      };
    } catch (error) {
      throw error;
    }
  }
  /**
   *
   */
  async updatePasswordOrName(
    id: string,
    updatePasswordOrNameDto: UpdateUserDto,
  ) {
    try {
      const { oldPassword, newPassword, name } = updatePasswordOrNameDto;
      if (!name && !newPassword) {
        throw new Error('Please provide name or password');
      }
      const user = await this.userDB.findOne({
        _id: id,
      });
      if (!user) {
        throw new Error('User not found');
      }
      if (newPassword) {
        const isPasswordMatch = await comparePassword(
          oldPassword,
          user.password,
        );
        if (!isPasswordMatch) {
          throw new Error('Invalid current password');
        }
        const password = await generateHashPassword(newPassword);
        await this.userDB.updateOne(
          {
            _id: id,
          },
          { password },
        );
      }
      if (name) {
        await this.userDB.updateOne({ _id: id }, { name });
      }
      return {
        success: true,
        message: 'User updated successfully',
        result: {
          name: user.name,
          email: user.email,
          type: user.type,
          id: user._id.toString(),
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
