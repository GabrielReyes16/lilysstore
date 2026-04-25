import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import './Landing.css';
import { ShoppingBag, MessageCircle, Menu, X, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Landing() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Categories
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (catError) console.error('Error fetching categories:', catError);
    else setCategories(catData || []);

    // Fetch Products
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (prodError) console.error('Error fetching products:', prodError);
    else setProducts(prodData || []);

    setLoading(false);
  };

  const handleWhatsAppClick = (product) => {
    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '';
    if (!phoneNumber) {
      toast.error("Configurar el número de WhatsApp en .env.local");
      return;
    }

    // Default country code could be hardcoded in the env or added here
    const message = `¡Hola! Vengo de Lily's Store y estoy interesado/a en el producto: *${product.name}* (Precio: $${product.price}). ¿Me pueden dar más información?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  const filteredProducts = selectedCategoryId === 'All'
    ? products
    : products.filter(p => p.category_id === selectedCategoryId);

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo">
            <ShoppingBag className="icon" />
            <h1>Lily's Store</h1>
          </div>

          <div className="desktop-menu">
            <a href="/">Catálogo</a>
            <a href="/login" className="admin-link">Admin</a>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="mobile-menu">
            <a href="/">Catálogo</a>
            <a href="/login">Ingreso Admin</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="container">
          <h2>Descubre nuestra colección</h2>
          <p>Encuentra tus favoritos y pide directo por WhatsApp</p>
        </div>
      </header>

      {/* Content */}
      <main className="container main-content">
        {/* Categories Bar */}
        <div className="categories-container">
          <div className="categories-wrapper">
            <button
              className={`category-pill ${selectedCategoryId === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId('All')}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="loading-state">Cargando catálogo...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">No hay productos disponibles por ahora.</div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="product-image" loading="lazy" />
                  ) : (
                    <div className="product-image-placeholder">Sin imagen</div>
                  )}
                  {product.categories?.name && (
                    <span className="product-badge">{product.categories.name}</span>
                  )}
                </div>

                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-footer">
                    <span className="price">${product.price}</span>
                    <button
                      onClick={() => handleWhatsAppClick(product)}
                      className="btn btn-primary ws-btn"
                    >
                      <MessageCircle size={18} /> Preguntar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-top container">
          <div className="footer-section" id='about'>
            <h4><ShoppingBag size={18} /> Lily's Store</h4>
            <p>Tu catálogo de confianza con los mejores productos. Descubre nuestra colección y encuentra tus favoritos hoy mismo.</p>
          </div>
          <div className="footer-section" id='delivery'>
            <h4><MapPin size={18} /> Entregas</h4>
            <p>Realizamos envíos en la zona del Callao (previa coordinación).</p>
          </div>
          <div className="footer-section" id='contact'>
            <h4><Phone size={18} /> Contacto</h4>
            <p>Presiona "Preguntar" de cualquiera de nuestros artículos para información o concretar compras.</p>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <div className="copyright">
              &copy; {new Date().getFullYear()} Lily's Store. Todos los derechos reservados.
            </div>
            <div className="developer">
              Desarrollado por{' '}
              <a href="https://portfolio-sigma-hazel-12.vercel.app/" target="_blank" rel="noopener noreferrer" className="dev-link">
                Math
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
