# Feedback Module — Integration Guide

A reusable feedback form that writes to Firestore and sends email notifications via a Firebase Cloud Function (2nd Gen).

---

## Architecture

```
User submits feedback
  → App writes to Firestore `feedback` collection
  → Cloud Function (onCreate trigger) sends email via Gmail SMTP
  → Email arrives at admin inbox
```

---

## Step 1: Client-Side Integration

### 1.1 Add the feedback form to your screen

You can either import `FeedbackForm.tsx` from this module, or inline the UI directly. Below is the inline approach used in `tccdk-mobile`:

```tsx
import { TextInput, Pressable, Keyboard, Alert, ActivityIndicator } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig'; // your Firestore instance

// State
const [feedbackMessage, setFeedbackMessage] = useState('');
const [sendingFeedback, setSendingFeedback] = useState(false);

// Handler
const handleSendFeedback = async () => {
    const trimmed = feedbackMessage.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    setSendingFeedback(true);
    try {
        await addDoc(collection(db, 'feedback'), {
            message: trimmed,
            userEmail: firebaseUser?.email ?? null,
            userName: userProfile?.displayName ?? null,
            createdAt: serverTimestamp(),
        });
        setFeedbackMessage('');
        Alert.alert('', 'Thank you for your feedback!');
    } catch {
        Alert.alert('Error', 'Failed to send. Please try again.');
    } finally {
        setSendingFeedback(false);
    }
};
```

### 1.2 JSX

```tsx
<View style={styles.feedbackSection}>
    <View style={styles.feedbackHeader}>
        <Feather name="message-square" size={16} color={theme.colors.primary} />
        <Text style={styles.feedbackTitle}>Share Feedback</Text>
    </View>
    <View style={styles.feedbackInputWrap}>
        <TextInput
            value={feedbackMessage}
            onChangeText={setFeedbackMessage}
            placeholder="Let us know your thoughts..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={5}
            style={styles.feedbackInput}
            textAlignVertical="top"
        />
    </View>
    <Pressable
        style={[styles.feedbackButton, sendingFeedback && { opacity: 0.6 }]}
        onPress={handleSendFeedback}
        disabled={sendingFeedback}
    >
        {sendingFeedback ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
            <>
                <Feather name="send" size={14} color={theme.colors.primary} />
                <Text style={styles.feedbackButtonText}>SEND</Text>
            </>
        )}
    </Pressable>
</View>
```

---

## Step 2: Firestore Security Rules

Add to your `firestore.rules`:

```
match /feedback/{feedbackId} {
  allow read: if isAdmin();
  allow create: if isAuthenticated();
  allow update, delete: if false;
}
```

### Deploy rules

```bash
firebase deploy --only firestore:rules --project <PROJECT_ID>
```

> **⚠️ CLI permission issues?** Paste the rules directly in the [Firebase Console → Firestore → Rules](https://console.firebase.google.com/project/_/firestore/rules) and click **Publish**.

---

## Step 3: Cloud Function (Email Trigger)

### 3.1 Create the `functions/` directory

```
project-root/
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
├── firebase.json
└── .firebaserc
```

### 3.2 `functions/package.json`

```json
{
  "name": "project-functions",
  "scripts": {
    "build": "tsc",
    "deploy": "firebase deploy --only functions"
  },
  "main": "lib/index.js",
  "engines": { "node": "20" },
  "dependencies": {
    "firebase-admin": "^13.0.0",
    "firebase-functions": "^6.3.0",
    "nodemailer": "^6.9.0"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.0",
    "typescript": "^5.9.0"
  },
  "private": true
}
```

### 3.3 `functions/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2022",
    "skipLibCheck": true
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

### 3.4 `functions/src/index.ts`

```typescript
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");

export const onFeedbackCreated = onDocumentCreated(
  {
    document: "feedback/{feedbackId}",
    secrets: [smtpUser, smtpPass],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const message = data.message ?? "(no message)";
    const userEmail = data.userEmail ?? "unknown";
    const userName = data.userName ?? "unknown";
    const createdAt = data.createdAt?.toDate?.()
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser.value(),
        pass: smtpPass.value(),
      },
    });

    const mailOptions = {
      from: `"App Feedback" <${smtpUser.value()}>`,
      to: "REPLACE_WITH_ADMIN_EMAIL",  // ← change this
      subject: `App Feedback from ${userName}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>From:</strong> ${userName} (${userEmail})</p>
        <p><strong>Date:</strong> ${createdAt}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      await snapshot.ref.update({ emailSent: true });
    } catch (error) {
      console.error("Failed to send feedback email:", error);
      await snapshot.ref.update({ emailSent: false, emailError: String(error) });
    }
  }
);
```

### 3.5 `firebase.json`

```json
{
  "firestore": { "rules": "firestore.rules" },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": ["node_modules", ".git"],
      "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
    }
  ]
}
```

### 3.6 `.firebaserc`

```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

---

## Step 4: Deploy

### 4.1 Firebase CLI Login

```bash
# Make sure you're logged in with the correct Google account
firebase logout
firebase login

# Verify access
firebase projects:list
```

### 4.2 Install function dependencies

```bash
cd functions && npm install
```

### 4.3 Set Gmail SMTP secrets

```bash
firebase functions:secrets:set SMTP_USER  # enter your Gmail address
firebase functions:secrets:set SMTP_PASS  # enter a Gmail App Password
```

> **Gmail App Password**: Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (requires 2FA enabled). Create an app password for "Mail".

### 4.4 Deploy the function

```bash
firebase deploy --only functions --project <PROJECT_ID>
```

> **⚠️ First-time 2nd Gen function error:**
> If you see `Permission denied while using the Eventarc Service Agent`, this is normal for the first deploy. **Wait 2-3 minutes and retry the same command.** Firebase needs time to propagate the Eventarc service agent permissions.

### 4.5 Deploy Firestore rules

```bash
firebase deploy --only firestore:rules --project <PROJECT_ID>
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `403 Permission denied` on deploy | Run `firebase logout` then `firebase login` with the correct Google account |
| `Eventarc Service Agent` error | Wait 2-3 minutes, then retry `firebase deploy --only functions` |
| Feedback saves but no email | Check the function deployed successfully in Firebase Console → Functions |
| Email not arriving | Check spam folder; verify App Password is correct |
| `Failed to send` in-app error | Firestore rules not deployed — paste rules in Firebase Console |

---

## Checklist for New Projects

- [ ] Add feedback handler + UI to your screen
- [ ] Add `feedback` collection rule to `firestore.rules`
- [ ] Deploy Firestore rules (CLI or paste in Console)
- [ ] Create `functions/` directory with the files above
- [ ] `cd functions && npm install`
- [ ] Update `to:` email in `index.ts`
- [ ] `firebase functions:secrets:set SMTP_USER`
- [ ] `firebase functions:secrets:set SMTP_PASS`
- [ ] `firebase deploy --only functions` (retry after 2-3 min if first time)
- [ ] Test: submit feedback → check Firestore → check email inbox
