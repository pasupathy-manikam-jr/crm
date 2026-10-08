<?php

namespace App\Http\Controllers;

use App\Http\Requests\Crm\ProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search'));

        return Inertia::render('products/index', [
            'products' => Product::query()
                ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%")))
                ->orderByDesc('active')->orderBy('name')->paginate(50)->withQueryString(),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $product = Product::create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name added.', ['name' => $product->name])]);

        return back();
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $product->name])]);

        return back();
    }

    /**
     * Quote lines keep their own description and price, so deleting is safe.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $product->name])]);

        return back();
    }
}
