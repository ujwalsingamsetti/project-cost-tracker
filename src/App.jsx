import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setItems, updateItem as updateItemAction, deleteItem as deleteItemAction } from './store/itemsSlice';
import { setOtherCosts, updateOtherCost as updateOtherCostAction, deleteOtherCost as deleteOtherCostAction } from './store/otherCostsSlice';
import { setUser, clearUser } from './store/authSlice';
import { Box, Heading, VStack, Input, Button, Text, useToast, NumberInput, NumberInputField, Select } from '@chakra-ui/react';
import { db, auth } from './firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

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
  const [sortBy, setSortBy] = useState('none');
  const [costFilter, setCostFilter] = useState(0);

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
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate().toISOString() // Convert to string
        }));
        dispatch(setItems(itemsData));
      }, (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Items snapshot error:', error);
          toast({ title: 'Error fetching items', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
      });

      unsubscribeCosts = onSnapshot(costsRef, (snapshot) => {
        const costsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate().toISOString() // Convert to string
        }));
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
      dispatch(clearUser());
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
      const newItem = {
        name: itemName,
        cost: Number(itemCost),
        timestamp: Timestamp.fromDate(new Date()), // Store in Firestore as Timestamp
      };
      if (editItemId) {
        const itemRef = doc(db, 'users', user.uid, 'items', editItemId);
        await updateDoc(itemRef, newItem);
        dispatch(updateItemAction({ 
          id: editItemId, 
          ...newItem, 
          timestamp: new Date().toISOString() // Store in Redux as string
        }));
        toast({ title: 'Item updated!', status: 'success', duration: 3000, isClosable: true });
        setEditItemId(null);
      } else {
        const itemsRef = collection(db, 'users', user.uid, 'items');
        const docRef = await addDoc(itemsRef, newItem);
        dispatch(setItems([...items, { 
          id: docRef.id, 
          ...newItem, 
          timestamp: new Date().toISOString() // Store in Redux as string
        }]));
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
      const newCost = {
        description: costDescription,
        amount: Number(costAmount),
        timestamp: Timestamp.fromDate(new Date()), // Store in Firestore as Timestamp
      };
      if (editCostId) {
        const costRef = doc(db, 'users', user.uid, 'otherCosts', editCostId);
        await updateDoc(costRef, newCost);
        dispatch(updateOtherCostAction({ 
          id: editCostId, 
          ...newCost, 
          timestamp: new Date().toISOString() // Store in Redux as string
        }));
        toast({ title: 'Cost updated!', status: 'success', duration: 3000, isClosable: true });
        setEditCostId(null);
      } else {
        const costsRef = collection(db, 'users', user.uid, 'otherCosts');
        const docRef = await addDoc(costsRef, newCost);
        dispatch(setOtherCosts([...otherCosts, { 
          id: docRef.id, 
          ...newCost, 
          timestamp: new Date().toISOString() // Store in Redux as string
        }]));
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

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'cost-asc') return a.cost - b.cost;
    if (sortBy === 'cost-desc') return b.cost - a.cost;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const filteredItems = sortedItems.filter((item) => item.cost >= costFilter);

  const totalItemsCost = items.reduce((sum, item) => sum + (item.cost || 0), 0);
  const totalOtherCosts = otherCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
  const totalCost = totalItemsCost + totalOtherCosts;

  const chartData = {
    labels: ['Items', 'Other Costs'],
    datasets: [
      {
        data: [totalItemsCost, totalOtherCosts],
        backgroundColor: ['#36A2EB', '#FF6384'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12 },
        },
      },
    },
  };

  if (!user) {
    return <Auth />;
  }

  return (
    <Box p={{ base: 2, md: 4 }} maxW="container.md" mx="auto">
      <VStack spacing={4} align="stretch">
        <Box
          display="flex"
          flexDirection={{ base: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ base: 'flex-start', md: 'center' }}
          gap={2}
        >
          <Heading size={{ base: 'md', md: 'lg' }}>Project Cost Tracker</Heading>
          <Button colorScheme="red" size={{ base: 'sm', md: 'md' }} onClick={handleSignOut}>
            Sign Out
          </Button>
        </Box>
        <Text fontSize={{ base: 'lg', md: 'xl' }}>Total Cost: ${totalCost.toFixed(2)}</Text>
        {(totalItemsCost > 0 || totalOtherCosts > 0) && (
          <Box>
            <Text fontSize={{ base: 'sm', md: 'md' }} mb={2}>Cost Breakdown:</Text>
            <Box maxW="300px" mx="auto">
              <Pie data={chartData} options={chartOptions} />
            </Box>
          </Box>
        )}

        <Heading size={{ base: 'sm', md: 'md' }}>Items</Heading>
        <Select
          placeholder="Sort by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          size={{ base: 'sm', md: 'md' }}
        >
          <option value="cost-asc">Cost (Low to High)</option>
          <option value="cost-desc">Cost (High to Low)</option>
          <option value="name">Name (A-Z)</option>
        </Select>
        <NumberInput value={costFilter} onChange={(value) => setCostFilter(Number(value))}>
          <NumberInputField placeholder="Filter items costing more than ($)" fontSize={{ base: 'sm', md: 'md' }} />
        </NumberInput>
        <VStack as="form" spacing={4} onSubmit={addItem}>
          <Input
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            size={{ base: 'sm', md: 'md' }}
          />
          <NumberInput>
            <NumberInputField
              placeholder="Cost ($)"
              value={itemCost}
              onChange={(e) => setItemCost(e.target.value)}
              fontSize={{ base: 'sm', md: 'md' }}
            />
          </NumberInput>
          <Button type="submit" colorScheme="blue" size={{ base: 'sm', md: 'md' }}>
            {editItemId ? 'Update Item' : 'Add Item'}
          </Button>
        </VStack>
        <VStack mt={4} spacing={2} align="stretch">
          {filteredItems.map((item) => (
            <Box key={item.id} p={2} borderWidth="1px" borderRadius="md">
              <Text fontSize={{ base: 'sm', md: 'md' }}>
                {item.name}: ${item.cost.toFixed(2)}
              </Text>
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">
                Added on: {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
              </Text>
              <Button size="xs" mr={2} onClick={() => editItem(item)}>Edit</Button>
              <Button size="xs" colorScheme="red" onClick={() => deleteItem(item.id)}>Delete</Button>
            </Box>
          ))}
        </VStack>

        <Heading size={{ base: 'sm', md: 'md' }} mt={6}>Other Costs</Heading>
        <VStack as="form" spacing={4} onSubmit={addOtherCost}>
          <Input
            placeholder="Description"
            value={costDescription}
            onChange={(e) => setCostDescription(e.target.value)}
            size={{ base: 'sm', md: 'md' }}
          />
          <NumberInput>
            <NumberInputField
              placeholder="Amount ($)"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              fontSize={{ base: 'sm', md: 'md' }}
            />
          </NumberInput>
          <Button type="submit" colorScheme="blue" size={{ base: 'sm', md: 'md' }}>
            {editCostId ? 'Update Cost' : 'Add Cost'}
          </Button>
        </VStack>
        <VStack mt={4} spacing={2} align="stretch">
          {otherCosts.map((cost) => (
            <Box key={cost.id} p={2} borderWidth="1px" borderRadius="md">
              <Text fontSize={{ base: 'sm', md: 'md' }}>
                {cost.description}: ${cost.amount.toFixed(2)}
              </Text>
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">
                Added on: {cost.timestamp ? new Date(cost.timestamp).toLocaleString() : 'N/A'}
              </Text>
              <Button size="xs" mr={2} onClick={() => editOtherCost(cost)}>Edit</Button>
              <Button size="xs" colorScheme="red" onClick={() => deleteOtherCost(cost.id)}>Delete</Button>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
};

export default App;