import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDescription, setOrderDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState({});
  const [products, setProducts] = useState([
    { id: 1, productName: 'HP laptop', productDescription: 'This is HP laptop' },
    { id: 2, productName: 'lenovo laptop', productDescription: 'This is lenovo' },
    { id: 3, productName: 'Car', productDescription: 'This is Car' },
    { id: 4, productName: 'Bike', productDescription: 'This is Bike' },
  ]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/order`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleOpenDialog = (order = null) => {
    setSelectedOrder(order);
    if (order) {
      setOrderDescription(order.orderDescription);
      // Reset selected products
      const productMap = {};
      if (order.products) {
        order.products.forEach(product => {
          productMap[product.id] = true;
        });
      }
      setSelectedProducts(productMap);
    } else {
      setOrderDescription('');
      setSelectedProducts({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
    setOrderDescription('');
    setSelectedProducts({});
  };

  const handleSubmit = async () => {
    try {
      const productIds = Object.keys(selectedProducts).filter(id => selectedProducts[id]);
      const orderData = {
        orderDescription,
        productIds: productIds.map(Number),
      };

      if (selectedOrder) {
        await axios.put(`${API_BASE_URL}/orders/${selectedOrder.id}`, orderData);
      } else {
        await axios.post(`${API_BASE_URL}/orders`, orderData);
      }

      handleCloseDialog();
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleDelete = async (orderId) => {
    try {
      await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toString().includes(searchTerm) ||
    order.orderDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Order Management
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="search by order description"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Id</TableCell>
              <TableCell>Order Description</TableCell>
              <TableCell>Count of Products</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.orderDescription}</TableCell>
                <TableCell>{order.countOfProducts}</TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(order)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(order.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpenDialog()}
        sx={{ mt: 2 }}
      >
        New Order
      </Button>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedOrder ? 'Edit Order' : 'New Order'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Order Description"
            value={orderDescription}
            onChange={(e) => setOrderDescription(e.target.value)}
            margin="normal"
          />
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Select Products:
          </Typography>
          {products.map((product) => (
            <FormControlLabel
              key={product.id}
              control={
                <Checkbox
                  checked={!!selectedProducts[product.id]}
                  onChange={(e) => setSelectedProducts({
                    ...selectedProducts,
                    [product.id]: e.target.checked
                  })}
                />
              }
              label={`${product.productName} - ${product.productDescription}`}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
