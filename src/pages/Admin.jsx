import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, LogOut, Image as ImageIcon, Tag, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import './Admin.css';

export default function Admin({ session }) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'categories'

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product Form State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) console.error('Error fetching categories', error);
    else setCategories(data || []);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching products', error);
    else setProducts(data || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const resetProductForm = () => {
    setName('');
    setCategoryId('');
    setDescription('');
    setPrice('');
    setIsActive(true);
    setImageFile(null);
    setImageUrl('');
    setIsEditingProduct(false);
    setCurrentProductId(null);
  };

  const handleEditProduct = (product) => {
    setActiveTab('products');
    setIsEditingProduct(true);
    setCurrentProductId(product.id);
    setName(product.name);
    setCategoryId(product.category_id || '');
    setDescription(product.description || '');
    setPrice(product.price);
    setIsActive(product.is_active);
    setImageUrl(product.image_url || '');
    setImageFile(null);
    window.scrollTo(0, 0);
  };

  const handleDeleteProduct = (id) => {
    toast((t) => (
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>¿Seguro que deseas eliminar este producto?</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
            onClick={async () => {
              toast.dismiss(t.id);
              const { error } = await supabase.from('products').delete().eq('id', id);
              if (error) {
                toast.error('Error al eliminar');
                console.error(error);
              } else {
                toast.success('Producto eliminado');
                fetchProducts();
              }
            }}
          >
            Eliminar
          </button>
          <button className="btn btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => toast.dismiss(t.id)}>
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const productData = {
        name,
        category_id: categoryId ? categoryId : null,
        description,
        price: parseFloat(price),
        is_active: isActive,
        image_url: finalImageUrl,
      };

      if (isEditingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentProductId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
      }

      resetProductForm();
      fetchProducts();
      toast.success(`Producto ${isEditingProduct ? 'actualizado' : 'creado'} exitosamente`);
    } catch (error) {
      toast.error('Error guardando el producto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName }]);

      if (error) throw error;

      setNewCategoryName('');
      fetchCategories();
      toast.success('Categoría creada!');
    } catch (error) {
      toast.error('Error al crear categoría: ' + error.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = (id) => {
    toast((t) => (
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>¿Eliminar esta categoría? Los productos vinculados quedarán en blanco.</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
            onClick={async () => {
              toast.dismiss(t.id);
              const { error } = await supabase.from('categories').delete().eq('id', id);
              if (error) {
                toast.error('Error al eliminar categoría');
              } else {
                toast.success('Categoría eliminada');
                fetchCategories();
                fetchProducts();
              }
            }}
          >
            Confirmar
          </button>
          <button className="btn btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => toast.dismiss(t.id)}>
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="container admin-nav">
          <h2>Panel Admin</h2>
          <button onClick={handleSignOut} className="btn btn-outline signout-btn">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="admin-tabs-container">
        <div className="container admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <LayoutGrid size={16} className="inline-icon" style={{ display: 'inline-block', verticalAlign: 'text-bottom' }} />
            Productos
          </button>
          <button
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <Tag size={16} className="inline-icon" style={{ display: 'inline-block', verticalAlign: 'text-bottom' }} />
            Categorías
          </button>
        </div>
      </div>

      <main className="container admin-main">
        {activeTab === 'categories' && (
          <>
            <section className="form-section">
              <h3>Nueva Categoría</h3>
              <form onSubmit={handleCategorySubmit} className="category-form">
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la categoría..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={savingCategory}>
                  {savingCategory ? 'Creando...' : 'Añadir'}
                </button>
              </form>
            </section>

            <section className="list-section">
              <h3>Todas las Categorías ({categories.length})</h3>
              <div className="category-list">
                {categories.map(cat => (
                  <div key={cat.id} className="category-item">
                    <span>{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="delete-icon" aria-label="Borrar">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && <p className="text-sm text-muted">Aun no hay categorías</p>}
              </div>
            </section>
          </>
        )}

        {activeTab === 'products' && (
          <>
            {/* Form Section */}
            <section className="form-section">
              <h3>{isEditingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <form onSubmit={handleProductSubmit} className="product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select
                      className="form-control"
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                    >
                      <option value="">-- Sin categoría --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Precio (s/)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Imagen</label>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => setImageFile(e.target.files[0])}
                        className="form-control file-input"
                      />
                      {imageUrl && !imageFile && <span className="text-sm text-green-600">Imagen actual guardada ✓</span>}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="isActive">Producto visible en el catálogo público</label>
                </div>

                <div className="form-actions">
                  {isEditingProduct && (
                    <button type="button" className="btn btn-outline" onClick={resetProductForm}>
                      Cancelar
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? 'Guardando...' : (isEditingProduct ? 'Actualizar' : 'Crear Producto')}
                  </button>
                </div>
              </form>
            </section>

            {/* List Section */}
            <section className="list-section">
              <h3>Productos ({products.length})</h3>
              {loading ? (
                <p>Cargando lista...</p>
              ) : (
                <div className="admin-product-list">
                  {products.map(product => (
                    <div key={product.id} className="admin-product-item">
                      <div className="item-details">
                        <div className="item-img">
                          {product.image_url ? (
                            <img src={product.image_url} alt="mini" />
                          ) : (
                            <ImageIcon className="no-img" />
                          )}
                        </div>
                        <div>
                          <h4>{product.name}</h4>
                          <div className="item-meta">
                            <span className="badge">{product.categories?.name || 'Sin categoría'}</span>
                            <span className="meta-price">${product.price}</span>
                            <span className={`status-dot ${product.is_active ? 'active' : 'inactive'}`}>
                              {product.is_active ? 'Visible' : 'Oculto'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button onClick={() => handleEditProduct(product)} className="action-btn edit" aria-label="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="action-btn delete" aria-label="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && <p className="text-muted">No hay productos todavía.</p>}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
