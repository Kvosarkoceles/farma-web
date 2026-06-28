import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

const localProductImages = import.meta.glob('../../assets/productos/*.{png,jpg,jpeg,webp,avif,gif,svg}', {
    eager: true,
    import: 'default'
});

const localProductImageMap = Object.fromEntries(
    Object.entries(localProductImages).map(([path, url]) => [path.split('/').pop(), url])
);

const resolveImageSrc = (rawImageUrl) => {
    if (!rawImageUrl) {
        return null;
    }

    const normalizedUrl = rawImageUrl.trim();
    if (!normalizedUrl) {
        return null;
    }

    if (
        normalizedUrl.startsWith('http://') ||
        normalizedUrl.startsWith('https://') ||
        normalizedUrl.startsWith('data:') ||
        normalizedUrl.startsWith('blob:')
    ) {
        return normalizedUrl;
    }

    const sanitizedPath = normalizedUrl.split('?')[0].split('#')[0];
    const fileName = sanitizedPath.split('/').pop();

    if (fileName && localProductImageMap[fileName]) {
        return localProductImageMap[fileName];
    }

    if (normalizedUrl.startsWith('/')) {
        return normalizedUrl;
    }

    return `${API_BASE_URL.replace(/\/$/, '')}/${normalizedUrl.replace(/^\//, '')}`;
};

const ProductImage = ({ product }) => {
    const [imageError, setImageError] = useState(false);

    const imageUrl = product?.image_url || product?.imagen_url || product?.image || product?.photo;

    useEffect(() => {
        setImageError(false);
    }, [imageUrl]);

    const imageSrc = resolveImageSrc(imageUrl);

    if (!imageSrc || imageError) {
        return <Package size={52} className="opacity-70" />;
    }

    return (
        <img
            src={imageSrc}
            alt={product.name || 'Producto'}
            className="h-full w-full object-contain p-3"
            onError={() => {
                console.error('Error cargando imagen:', imageSrc);
                setImageError(true);
            }}
        />
    );
};

export { ProductImage };
export default ProductImage;

