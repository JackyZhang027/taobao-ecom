# Taobao Clone E-Commerce Platform

A modern, full-stack e-commerce platform built with Laravel, Inertia.js, React, and Tailwind CSS. The application features a fully functional customer storefront and a comprehensive admin dashboard for managing products, categories, orders, and shop settings.

## 🚀 Tech Stack

- **Backend:** Laravel 12.x, PHP 8.3+
- **Frontend:** React 18, Inertia.js
- **Styling:** Tailwind CSS, shadcn/ui components
- **Database:** MySQL
- **Build Tool:** Vite
- **Media Management:** Spatie Media Library
- **Authentication:** Laravel Breeze

## 📦 Key Features

### Storefront
- **Modern UI Suite:** Premium split-layout authentication, elegant product pages, and a dynamic home page.
- **Product Catalog:** Advanced filtering by category, intelligent search, and variant selection (sizes, colors, etc.).
- **Multi-Currency Support:** Handles RMB base prices and converts to IDR dynamically.
- **Shopping Cart:** Full cart functionality supporting both simple and variable products.
- **Checkout Flow:** Integrated shipping and dynamic totals calculation.

### Admin Dashboard
- **Product Management:** Create, edit, and soft-delete products. Manage complex product variants and SKUs.
- **Media Gallery:** Enhanced drag-and-drop image uploads for categories and products using Spatie.
- **Layout Control:** Manage active hero slides, banners, and static page content.
- **Order Processing:** View customer orders and manage fulfillment status.

## 🛠️ Installation & Setup

1. **Clone the repository and install PHP dependencies**
```bash
composer install
```

2. **Install JavaScript dependencies**
```bash
npm install
```

3. **Environment Setup**
Copy the environment file and generate the application key.
```bash
cp .env.example .env
php artisan key:generate
```

4. **Database Configuration**
Configure your `.env` file with your database credentials. Then run the migrations and seeders (if available):
```bash
php artisan migrate
```

5. **Storage Link**
Link your storage directory to public to ensure images load correctly:
```bash
php artisan storage:link
```

6. **Serve the Application**
You will need to run both the Laravel development server and the Vite asset bundler:
```bash
# Terminal 1: Run the Laravel server (or use Laravel Herd)
php artisan serve

# Terminal 2: Run the Vite development server
npm run dev
```

## 🏗️ Architecture

The application is structured using **Laravel Modules**, separating distinct domains:
- **`Modules/Catalog`:** Products, Categories, Attributes, and storefront browsing.
- **`Modules/Ordering`:** Cart logic, Checkout flows, and Order management.
- **`Modules/Admin`:** Secure backend dashboard interfaces for store owners.
- **`Modules/Currency`:** Handles real-time localized currency conversions.

## 🎨 UI/UX Highlights
- **shadcn/ui:** Leverages highly accessible, customizable Radix UI primitives.
- **Responsive Design:** Fully responsive layout optimized for mobile shopping.
- **Premium Auth:** Custom-designed login/register screens featuring elegant split-pane layouts and typography.
