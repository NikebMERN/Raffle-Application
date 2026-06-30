import { IsString, IsOptional, IsInt, Min, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RewardTierDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  position!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(1)
  winnersCount!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRewardConfigDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  raffleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roundId?: string;

  @ApiProperty({ description: 'Total number of persons to be rewarded' })
  @IsInt()
  @Min(1)
  numberOfWinners!: number;

  @ApiProperty({ type: [RewardTierDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardTierDto)
  rewards!: RewardTierDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRewardConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  raffleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roundId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  numberOfWinners?: number;

  @ApiProperty({ required: false, type: [RewardTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardTierDto)
  rewards?: RewardTierDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
