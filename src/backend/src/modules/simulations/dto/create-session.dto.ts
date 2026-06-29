import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'ID của tình huống mô phỏng',
    example: 'uuid-string',
  })
  @IsUUID()
  scenarioId: string;

  @ApiProperty({
    description: 'ID của nhân vật học viên chọn để hóa thân',
    example: 'uuid-string',
  })
  @IsUUID()
  chosenCharacterId: string;
}
