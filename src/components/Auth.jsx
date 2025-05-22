import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, clearUser } from '../store/authSlice';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Box, Button, Input, FormControl, FormLabel, Heading, useToast, VStack } from '@chakra-ui/react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        dispatch(setUser({ uid: user.uid, email: user.email }));
      } else {
        dispatch(clearUser());
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Signed up successfully!', status: 'success', duration: 3000, isClosable: true });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Logged in successfully!', status: 'success', duration: 3000, isClosable: true });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged out successfully!', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  if (user) {
    return (
      <Box p={4}>
        <Heading size="lg">Welcome, {user.email}</Heading>
        <Button mt={4} colorScheme="red" onClick={handleSignOut}>
          Sign Out
        </Button>
      </Box>
    );
  }

  return (
    <VStack spacing={4} p={4} maxW="400px" mx="auto">
      <Heading size="lg">{isSignUp ? 'Sign Up' : 'Sign In'}</Heading>
      <FormControl>
        <FormLabel>Email</FormLabel>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
      </FormControl>
      <FormControl>
        <FormLabel>Password</FormLabel>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
      </FormControl>
      <Button colorScheme="blue" onClick={handleAuth} width="full">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </Button>
      <Button variant="link" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </Button>
    </VStack>
  );
};

export default Auth;