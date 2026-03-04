import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
    const { user, logout } = useAuth();
    const { cart, updateCartItem, removeFromCart, clearCart } = useContext(CartContext);
    const navigate = useNavigate();

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [shippingData, setShippingData] = useState({
        nombre: user ? `${user.nombre || ''} ${user.apellido || ''}`.trim() : '',
        direccion: '',
        ciudad: '',
        cp: '',
        telefono: ''
    });
    const [cardData, setCardData] = useState({
        numero: '',
        expiracion: '',
        cvc: ''
    });

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';

    const subtotal = cart.reduce((acc, item) => acc + ((item.precioMXN || item.price) * item.quantity), 0);
    const envio = subtotal > 0 && subtotal < 1500 ? 150 : 0; // Envío gratis en pedidos de más de 1500
    const granTotal = subtotal + envio;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingData(prev => ({ ...prev, [name]: value }));
    };

    const handleCardChange = (e) => {
        const { name, value } = e.target;
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    const handleFinalizarCompra = async () => {
        if (!user) {
            alert("Inicia sesión para finalizar tu compra.");
            navigate('/login');
            return;
        }

        if (cart.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        // Validación simple de formulario ficticio
        if (!shippingData.direccion || !shippingData.ciudad || !shippingData.cp) {
            alert("Por favor, completa los datos de envío.");
            return;
        }

        if (paymentMethod === 'card' && (!cardData.numero || !cardData.expiracion || !cardData.cvc)) {
            alert("Por favor, completa los datos de tu tarjeta.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const nombreFinal = shippingData.nombre || "Cliente Registrado";

            const ordenData = {
                nombreCliente: nombreFinal,
                productos: cart.map(item => ({
                    nombre: item.title,
                    talla: item.selectedSize || "N/A",
                    color: item.selectedColor || "N/A",
                    precio: Number(item.precioMXN || item.price),
                    cantidad: Number(item.quantity)
                })),
                total: Number(granTotal.toFixed(2))
            };

            await axios.post(`${baseURL}/admin/panel/ventas`, ordenData, {
                headers: { 'x-auth-token': token }
            });
            
            alert("¡Compra finalizada con éxito! Tu pedido ha sido procesado.");
            clearCart();
            navigate('/'); // Regresar al catálogo
        } catch (error) {
            console.error("Error al procesar la compra:", error.response?.data || error.message);
            alert("Error en el servidor al procesar la venta.");
        }
    };

    return (
        <div className="client-view">
            {/* Header consistente con la app */}
            <header className="client-header-makia">
                <Link to="/" style={{display: 'flex', alignItems: 'center', textDecoration: 'none'}}>
                    <img src="/logo-makia-pages.png" alt="Logo" className="brand-logo-img" />
                </Link>
                <div className="header-right-icons">
                    <div className="cart-wrapper" onClick={() => navigate('/cart')}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{cart.length}</span>
                    </div>
                    {user ? (
                        <div className="user-icon" onClick={logout} title="Cerrar sesión"><i className="fas fa-sign-out-alt"></i></div>
                    ) : (
                        <div className="user-icon" onClick={() => navigate('/login')} title="Iniciar Sesión"><i className="far fa-user"></i></div>
                    )}
                </div>
            </header>

            <div className="cart-page-container">
                <h1 className="cart-page-title">CHECKOUT</h1>

                <div className="cart-items-section">
                    {cart.length === 0 ? (
                        <div className="cart-empty-msg">
                            <h2>TU BOLSA ESTÁ VACÍA</h2>
                            <p>Parece que aún no has agregado nada a tu carrito.</p>
                            <Link to="/" className="back-to-shop-link">Continuar Comprando</Link>
                        </div>
                    ) : (
                        cart.map((item, i) => (
                            <div key={i} className="checkout-item-card">
                                <img src={item.selectedImage || "/placeholder.jpg"} alt={item.title} className="checkout-item-img" />
                                <div className="checkout-item-details">
                                    <div className="checkout-item-head">
                                        <div>
                                            <h3>{item.title}</h3>
                                            <p className="checkout-item-meta">
                                                Color: {item.selectedColor || 'N/A'} | Talla: {item.selectedSize || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="checkout-item-price">
                                            ${((item.precioMXN || item.price) * item.quantity).toLocaleString()} MXN
                                        </div>
                                    </div>
                                    
                                    <div className="checkout-item-controls">
                                        <div className="checkout-qty-stepper">
                                            <button onClick={() => updateCartItem(i, { ...item, quantity: Math.max(1, item.quantity - 1) })}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateCartItem(i, { ...item, quantity: item.quantity + 1 })}>+</button>
                                        </div>
                                        <button className="checkout-btn-remove" onClick={() => removeFromCart(i)}>
                                            <i className="fas fa-trash-alt" style={{marginRight: '5px'}}></i> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="checkout-summary-section">
                        {/* FORMULARIO ENVIO */}
                        <div className="checkout-form-group">
                            <h4>1. Datos de Envío</h4>
                            <input type="text" name="nombre" placeholder="Nombre completo" className="checkout-input" value={shippingData.nombre} onChange={handleInputChange} />
                            <input type="text" name="telefono" placeholder="Teléfono" className="checkout-input" value={shippingData.telefono} onChange={handleInputChange} />
                            <input type="text" name="direccion" placeholder="Dirección (Calle y número)" className="checkout-input" value={shippingData.direccion} onChange={handleInputChange} />
                            
                            <div className="checkout-input-row">
                                <input type="text" name="ciudad" placeholder="Ciudad / Municipio" className="checkout-input" value={shippingData.ciudad} onChange={handleInputChange} />
                                <input type="text" name="cp" placeholder="Código Postal" className="checkout-input" value={shippingData.cp} onChange={handleInputChange} />
                            </div>
                        </div>

                        {/* FORMULARIO PAGO */}
                        <div className="checkout-form-group">
                            <h4>2. Método de Pago</h4>
                            <div className="payment-methods-grid">
                                <div className={`payment-method-box ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')}>
                                    <i className="far fa-credit-card"></i>
                                    <span>Tarjeta</span>
                                </div>
                                <div className={`payment-method-box ${paymentMethod === 'paypal' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paypal')}>
                                    <i className="fab fa-paypal"></i>
                                    <span>PayPal</span>
                                </div>
                                <div className={`payment-method-box ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                                    <i className="fas fa-money-bill-wave"></i>
                                    <span>Efectivo OXXO</span>
                                </div>
                            </div>

                            {paymentMethod === 'card' && (
                                <div className="card-details-form">
                                    <input type="text" name="numero" placeholder="Número de Tarjeta" className="checkout-input" value={cardData.numero} onChange={handleCardChange} maxLength="19" />
                                    <div className="checkout-input-row">
                                        <input type="text" name="expiracion" placeholder="MM/AA" className="checkout-input" value={cardData.expiracion} onChange={handleCardChange} maxLength="5" />
                                        <input type="text" name="cvc" placeholder="CVC" className="checkout-input" value={cardData.cvc} onChange={handleCardChange} maxLength="4" />
                                    </div>
                                </div>
                            )}
                            {paymentMethod === 'paypal' && (
                                <p style={{fontSize:'13px', color:'#aaa', textAlign:'center', margin:'10px 0'}}>Serás redirigido a PayPal para completar tu pago de forma segura.</p>
                            )}
                            {paymentMethod === 'cash' && (
                                <p style={{fontSize:'13px', color:'#aaa', textAlign:'center', margin:'10px 0'}}>Generaremos un código de barras para que pagues en cualquier sucursal OXXO.</p>
                            )}
                        </div>

                        {/* RESUMEN TOTALES */}
                        <div className="total-summary-box">
                            <div className="summary-row">
                                <span>Subtotal ({cart.length} artículos)</span>
                                <span>${subtotal.toLocaleString()} MXN</span>
                            </div>
                            <div className="summary-row">
                                <span>Envío {envio === 0 ? '(Gratis)' : ''}</span>
                                <span>{envio === 0 ? '$0.00' : `$${envio.toLocaleString()} MXN`}</span>
                            </div>
                            <div className="summary-row grand-total">
                                <span>TOTAL</span>
                                <span>${granTotal.toLocaleString()} MXN</span>
                            </div>

                            <button className="btn-confirm-purchase" onClick={handleFinalizarCompra}>
                                CONFIRMAR PAGO
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
