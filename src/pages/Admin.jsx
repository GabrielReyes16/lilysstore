import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, LogOut, Image as ImageIcon } from 'lucide-react';
import './Admin.css';

export default function Admin({ session }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching products', error);
    else setProducts(data || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setPrice('');
    setIsActive(true);
    setImageFile(null);
    setImageUrl('');
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setCurrentId(product.id);
    setName(product.name);
    setCategory(product.category || '');
    setDescription(product.description || '');
    setPrice(product.price);
    setIsActive(product.is_active);
    setImageUrl(product.image_url || '');
    setImageFile(null);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar');
      console.error(error);
    } else {
      fetchProducts();
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    // Reemplaza 'products' por el nombre de tu bucket de Supabase si es distinto
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const productData = {
        name,
        category,
        description,
        price: parseFloat(price),
        is_active: isActive,
        image_url: finalImageUrl,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
      }

      resetForm();
      fetchProducts();
      alert(`Producto ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
    } catch (error) {
      alert('Error guardando el producto: ' + error.message);
    } finally {
      setUploading(false);
    }
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

      <main className="container admin-main">
        {/* Form Section */}
        <section className="form-section">
          <h3>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del producto</label>
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
                <input 
                  type="text" 
                  className="form-control" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  placeholder="Ej: Ropa, Accesorios..."
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Precio ($)</label>
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
              {isEditing && (
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {uploading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Producto')}
              </button>
            </div>
          </form>
        </section>

        {/* List Section */}
        <section className="list-section">
          <h3>Productos Existentes</h3>
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
                        <span className="badge">{product.category || 'Sin categoría'}</span>
                        <span className="meta-price">${product.price}</span>
                        <span className={`status-dot ${product.is_active ? 'active' : 'inactive'}`}>
                          {product.is_active ? 'Visible' : 'Oculto'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => handleEdit(product)} className="action-btn edit" aria-label="Editar">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="action-btn delete" aria-label="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p className="text-muted">No hay productos todavía.</p>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
