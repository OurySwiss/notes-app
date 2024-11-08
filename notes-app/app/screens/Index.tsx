// app/screens/Index.tsx
import React from 'react';
import { Button, Text, View } from 'react-native';
import { FIREBASE_AUTH } from '../../FirebaseConfig';

const Index = () => {
  const user = FIREBASE_AUTH.currentUser;
  return (
    <View>
      <Text>Hello {user?.displayName}</Text>
      <Button title="Logout" onPress={() => FIREBASE_AUTH.signOut()} />
    </View>
  );
};

export default Index;
