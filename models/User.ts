import mongoose, { InferSchemaType, Model } from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: 'admin',
      trim: true,
    },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

const User = (mongoose.models.User as Model<UserDocument>) || mongoose.model<UserDocument>('User', UserSchema);

declare global {
  var battlenixUserIndexesReady: boolean | undefined;
}

export async function ensureUserIndexes() {
  if (globalThis.battlenixUserIndexesReady) {
    return;
  }

  await User.syncIndexes();
  globalThis.battlenixUserIndexesReady = true;
}

export default User;
