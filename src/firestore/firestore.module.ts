import { Module, Global } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

@Global()
@Module({
  providers: [
    {
      provide: 'FIRESTORE',
      useFactory: () => {
        // Google Cloud Firestore 공식 권장 방식
        return new Firestore({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        });
      },
    },
  ],
  exports: ['FIRESTORE'], // 다른 모듈에서 사용할 수 있도록 export
})
export class FirestoreModule {}
