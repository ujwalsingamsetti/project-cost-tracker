import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setItems, updateItem as updateItemAction, deleteItem as deleteItemAction } from './store/itemsSlice';
import { setOtherCosts, updateOtherCost as updateOtherCostAction, deleteOtherCost as deleteOtherCostAction } from './store/otherCostsSlice';
import { setUser, clearUser } from './store/authSlice'; // Added clearUser
import { Box, Heading, VStack, Input, Button, Text, useToast, NumberInput, NumberInputField } from '@chakra-ui/react';
import { db, auth } from './firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth';

const App = () => {
  const user = useSelector((state) => state.auth.user);
  const items = useSelector((state) => state.items.items);
  const otherCosts = useSelector((state) => state.otherCosts.otherCosts);
  const dispatch = useDispatch();
  const toast = useToast();

  const [itemName, setItemName] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [editItemId, setEditItemId] = useState(null);
  const [costDescription, setCostDescription] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [editCostId, setEditCostId] = useState(null);

  // Set up Firebase auth listener to update Redux user state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      dispatch(setUser(firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null));
    });

    return () => unsubscribeAuth();
  }, [dispatch]);

  useEffect(() => {
    let unsubscribeItems = null;
    let unsubscribeCosts = null;

    if (user) {
      const itemsRef = collection(db, 'users', user.uid, 'items');
      const costsRef = collection(db, 'users', user.uid, 'otherCosts');

      unsubscribeItems = onSnapshot(itemsRef, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        dispatch(setItems(itemsData));
      }, (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Items snapshot error:', error);
          toast({ title: 'Error fetching items', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
      });

      unsubscribeCosts = onSnapshot(costsRef, (snapshot) => {
        const costsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        dispatch(setOtherCosts(costsData));
      }, (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Costs snapshot error:', error);
          toast({ title: 'Error fetching costs', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
      });
    }

    return () => {
      if (unsubscribeItems) unsubscribeItems();
      if (unsubscribeCosts) unsubscribeCosts();
      dispatch(setItems([]));
      dispatch(setOtherCosts([]));
    };
  }, [user, dispatch, toast]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(clearUser()); // Explicitly clear the user state
      dispatch(setItems([]));
      dispatch(setOtherCosts([]));
      toast({ title: 'Logged out successfully!', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemCost) return;

    try {
      const newItem = { name: itemName, cost: Number(itemCost) };
      if (editItemId) {
        const itemRef = doc(db, 'users', user.uid, 'items', editItemId);
        await updateDoc(itemRef, newItem);
        dispatch(updateItemAction({ id: editItemId, ...newItem }));
        toast({ title: 'Item updated!', status: 'success', duration: 3000, isClosable: true });
        setEditItemId(null);
      } else {
        const itemsRef = collection(db, 'users', user.uid, 'items');
        const docRef = await addDoc(itemsRef, newItem);
        dispatch(setItems([...items, { id: docRef.id, ...newItem }]));
        toast({ title: 'Item added!', status: 'success', duration: 3000, isClosable: true });
      }
      setItemName('');
      setItemCost('');
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const editItem = (item) => {
    setItemName(item.name);
    setItemCost(item.cost);
    setEditItemId(item.id);
  };

  const deleteItem = async (id) => {
    try {
      const itemRef = doc(db, 'users', user.uid, 'items', id);
      await deleteDoc(itemRef);
      dispatch(deleteItemAction(id));
      toast({ title: 'Item deleted!', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const addOtherCost = async (e) => {
    e.preventDefault();
    if (!costDescription || !costAmount) return;

    try {
      const newCost = { description: costDescription, amount: Number(costAmount) };
      if (editCostId) {
        const costRef = doc(db, 'users', user.uid, 'otherCosts', editCostId);
        await updateDoc(costRef, newCost);
        dispatch(updateOtherCostAction({ id: editCostId, ...newCost }));
        toast({ title: 'Cost updated!', status: 'success', duration: 3000, isClosable: true });
        setEditCostId(null);
      } else {
        const costsRef = collection(db, 'users', user.uid, 'otherCosts');
        const docRef = await addDoc(costsRef, newCost);
        dispatch(setOtherCosts([...otherCosts, { id: docRef.id, ...newCost }]));
        toast({ title: 'Cost added!', status: 'success', duration: 3000, isClosable: true });
      }
      setCostDescription('');
      setCostAmount('');
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const editOtherCost = (cost) => {
    setCostDescription(cost.description);
    setCostAmount(cost.amount);
    setEditCostId(cost.id);
  };

  const deleteOtherCost = async (id) => {
    try {
      const costRef = doc(db, 'users', user.uid, 'otherCosts', id);
      await deleteDoc(costRef);
      dispatch(deleteOtherCostAction(id));
      toast({ title: 'Cost deleted!', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0) +
                   otherCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  if (!user) {
    return <Auth />;
  }

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading>Project Cost Tracker</Heading>
          <Button colorScheme="red" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Box>
        <Text fontSize="xl">Total Cost: ${totalCost.toFixed(2)}</Text>

        <Heading size="md">Items</Heading>
        <VStack as="form" spacing={4} onSubmit={addItem}>
          <Input
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <NumberInput>
            <NumberInputField
              placeholder="Cost ($)"
              value={itemCost}
              onChange={(e) => setItemCost(e.target.value)}
            />
          </NumberInput>
          <Button type="submit" colorScheme="blue">
            {editItemId ? 'Update Item' : 'Add Item'}
          </Button>
        </VStack>
        <VStack mt={4} spacing={2} align="stretch">
          {items.map((item) => (
            <Box key={item.id} p={2} borderWidth="1px" borderRadius="md">
              <Text>
                {item.name}: ${item.cost.toFixed(2)}
              </Text>
              <Button size="sm" mr={2} onClick={() => editItem(item)}>Edit</Button>
              <Button size="sm" colorScheme="red" onClick={() => deleteItem(item.id)}>Delete</Button>
            </Box>
          ))}
        </VStack>

        <Heading size="md" mt={6}>Other Costs</Heading>
        <VStack as="form" spacing={4} onSubmit={addOtherCost}>
          <Input
            placeholder="Description"
            value={costDescription}
            onChange={(e) => setCostDescription(e.target.value)}
          />
          <NumberInput>
            <NumberInputField
              placeholder="Amount ($)"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
            />
          </NumberInput>
          <Button type="submit" colorScheme="blue">
            {editCostId ? 'Update Cost' : 'Add Cost'}
          </Button>
        </VStack>
        <VStack mt={4} spacing={2} align="stretch">
          {otherCosts.map((cost) => (
            <Box key={cost.id} p={2} borderWidth="1px" borderRadius="md">
              <Text>
                {cost.description}: ${cost.amount.toFixed(2)}
              </Text>
              <Button size="sm" mr={2} onClick={() => editOtherCost(cost)}>Edit</Button>
              <Button size="sm" colorScheme="red" onClick={() => deleteOtherCost(cost.id)}>Delete</Button>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
};

export default App;