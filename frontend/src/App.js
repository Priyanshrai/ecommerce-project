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
  Alert,
  Box,
  Chip,
  Fade,
  Tooltip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import axios from 'axios';

// Add Google Font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ecommerce-project-gex2yqi2o-priyanshrais-projects.vercel.app/api'
  : 'http://localhost:5000/api';

// Custom styles
const styles = {
  header: {
    background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
    padding: '2rem',
    borderRadius: '15px',
    marginBottom: '2rem',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
    color: 'white',
    textAlign: 'center',
  },
  statsCard: {
    background: 'white',
    padding: '1rem',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  table: {
    '& .MuiTableCell-head': {
      fontWeight: 600,
      background: '#f8f9fa',
    },
    '& .MuiTableRow-root:hover': {
      backgroundColor: '#f8f9fa',
      transition: 'background-color 0.2s ease',
    },
  },
  actionButton: {
    borderRadius: '20px',
    textTransform: 'none',
    fontWeight: 500,
  },
};

function App() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDescription, setOrderDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const [products] = useState([
    { id: 1, productname: 'HP laptop', productdescription: 'This is HP laptop', icon: '💻' },
    { id: 2, productname: 'lenovo laptop', productdescription: 'This is lenovo', icon: '💻' },
    { id: 3, productname: 'Car', productdescription: 'This is Car', icon: '🚗' },
    { id: 4, productname: 'Bike', productdescription: 'This is Bike', icon: '🏍️' },
  ]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE_URL}/order`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (order = null) => {
    setError('');
    setSelectedOrder(order);
    if (order) {
      setOrderDescription(order.orderdescription);
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
    setError('');
    setOpenDialog(false);
    setSelectedOrder(null);
    setOrderDescription('');
    setSelectedProducts({});
  };

  const handleSubmit = async () => {
    try {
      setError('');
      if (!orderDescription.trim()) {
        setError('Order description is required');
        return;
      }

      const productIds = Object.keys(selectedProducts).filter(id => selectedProducts[id]);
      if (productIds.length === 0) {
        setError('Please select at least one product');
        return;
      }

      const orderData = {
        orderDescription: orderDescription,
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
      setError('Failed to save order. Please try again.');
    }
  };

  const handleDelete = async (orderId) => {
    try {
      setError('');
      await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      setError('Failed to delete order. Please try again.');
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toString().includes(searchTerm) ||
    order.orderdescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, fontFamily: 'Poppins, sans-serif' }}>
      <Fade in timeout={800}>
        <Box sx={styles.header}>
          <StorefrontIcon sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Order Management
          </Typography>
          <Typography variant="subtitle1">
            Manage your orders with ease and style ✨
          </Typography>
        </Box>
      </Fade>

      <Fade in timeout={1000}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Paper sx={styles.statsCard}>
            <ShoppingCartIcon color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {orders.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Orders
              </Typography>
            </Box>
          </Paper>
          <Paper sx={styles.statsCard}>
            <StorefrontIcon color="secondary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {products.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Products
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Fade>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, borderRadius: '10px' }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        variant="outlined"
        placeholder="🔍 Search by order ID or description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ 
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
          },
        }}
      />

      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          mb: 3,
        }}
      >
        <Table sx={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Order Description</TableCell>
              <TableCell>Products</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No orders found 🔍
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Chip 
                      label={`#${order.id}`}
                      color="primary"
                      size="small"
                      sx={{ borderRadius: '8px' }}
                    />
                  </TableCell>
                  <TableCell>{order.orderdescription}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${order.countofproducts || 0} items`}
                      color="secondary"
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: '8px' }}
                    />
                  </TableCell>
                  <TableCell>
                    {order.createdat ? new Date(order.createdat).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Order" arrow>
                      <IconButton 
                        onClick={() => handleOpenDialog(order)}
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Order" arrow>
                      <IconButton
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this order?')) {
                            handleDelete(order.id);
                          }
                        }}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpenDialog()}
        startIcon={<AddCircleIcon />}
        sx={{
          ...styles.actionButton,
          py: 1.5,
          px: 3,
          fontSize: '1rem',
        }}
      >
        Create New Order
      </Button>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {selectedOrder ? '✏️ Edit Order' : '✨ Create New Order'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, borderRadius: '8px' }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Order Description"
            value={orderDescription}
            onChange={(e) => setOrderDescription(e.target.value)}
            margin="normal"
            required
            error={!orderDescription.trim()}
            helperText={!orderDescription.trim() ? 'Order description is required' : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 500 }}>
            Select Products:
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Paper
              sx={{
                p: 2,
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: '#f8f9fa',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5" sx={{ minWidth: 40 }}>
                  📋
                </Typography>
                <Box flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Select All Products
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={products.every(p => selectedProducts[p.id])}
                      indeterminate={products.some(p => selectedProducts[p.id]) && !products.every(p => selectedProducts[p.id])}
                      onChange={(e) => {
                        const newSelected = {};
                        products.forEach(product => {
                          newSelected[product.id] = e.target.checked;
                        });
                        setSelectedProducts(newSelected);
                      }}
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </Box>
            </Paper>
            {products.map((product) => (
              <Paper
                key={product.id}
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: selectedProducts[product.id] ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" sx={{ minWidth: 40 }}>
                    {product.icon}
                  </Typography>
                  <Box 
                    flex={1} 
                    onClick={() => setSelectedProducts({
                      ...selectedProducts,
                      [product.id]: !selectedProducts[product.id]
                    })}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {product.productname}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.productdescription}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!selectedProducts[product.id]}
                        onChange={(e) => {
                          setSelectedProducts({
                            ...selectedProducts,
                            [product.id]: e.target.checked
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={styles.actionButton}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            sx={styles.actionButton}
          >
            {selectedOrder ? 'Update Order' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
