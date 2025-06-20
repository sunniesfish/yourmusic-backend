import { Module } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

@Module({
  providers: [
    {
      provide: 'FIRESTORE',
      useFactory: () => {
        // Google Cloud Firestore 공식 권장 방식
        return new Firestore({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          // 또는 환경변수에서 직접 credential 설정
          // credential: {
          //   client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          //   private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          //   project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
          // }
        });
      },
    },
  ],
  exports: ['FIRESTORE'], // 다른 모듈에서 사용할 수 있도록 export
})
export class FirestoreModule {}
