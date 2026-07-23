// EditInvoice.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api";

const inputClass =
  "w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

const company = {
  logo: "https://dummyimage.com/120x60/0f766e/ffffff&text=LOGO",
  name: "TechCorp Solutions",
  mobile: "+91 9876543210",
  address: "Madhapur, Hyderabad, India",
  email: "info@techcorp.com",
  website: "www.techcorp.com",
};

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invoice, setInvoice] = useState({
    clientName: "",
    clientMobile: "",
    clientAddress: "",
    date: "",
    items: [
      {
        description: "",
        price: "",
        quantity: "",
        _id: null,
      },
    ],
  });

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/manual-invoices`);
      if (response.data.success) {
        const foundInvoice = response.data.data.find(
          (inv) => inv._id === id
        );
        if (foundInvoice) {
          // Transform items to match form structure
          const formattedItems = foundInvoice.items.map((item) => ({
            _id: item._id || null,
            description: item.description || "",
            price: item.price.toString() || "",
            quantity: item.quantity.toString() || "",
          }));

          // Format date for input field
          const formattedDate = foundInvoice.date 
            ? new Date(foundInvoice.date).toISOString().split('T')[0]
            : "";

          setInvoice({
            clientName: foundInvoice.clientName || "",
            clientMobile: foundInvoice.clientMobile || "",
            clientAddress: foundInvoice.clientAddress || "",
            date: formattedDate,
            items: formattedItems.length > 0 ? formattedItems : [
              {
                description: "",
                price: "",
                quantity: "",
                _id: null,
              },
            ],
          });
        } else {
          setError("Invoice not found");
        }
      } else {
        setError("Failed to fetch invoice");
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError("Failed to fetch invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateItemTotal = (price, quantity) => {
    return (Number(price) || 0) * (Number(quantity) || 0);
  };

  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => {
      return sum + calculateItemTotal(item.price, item.quantity);
    }, 0);
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    
    if (index !== undefined) {
      const updatedItems = [...invoice.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: value,
      };
      
      setInvoice((prev) => ({
        ...prev,
        items: updatedItems,
      }));
    } else {
      setInvoice((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          price: "",
          quantity: "",
          _id: null,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (invoice.items.length > 1) {
      const updatedItems = invoice.items.filter((_, i) => i !== index);
      setInvoice((prev) => ({
        ...prev,
        items: updatedItems,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Format items for API - include _id for existing items, exclude for new ones
      const formattedItems = invoice.items.map((item) => {
        const formattedItem = {
          description: item.description,
          price: Number(item.price),
          quantity: Number(item.quantity),
        };
        
        // Include _id only if it exists (for existing items)
        if (item._id) {
          formattedItem._id = item._id;
        }
        
        return formattedItem;
      });

      const payload = {
        clientName: invoice.clientName,
        clientMobile: invoice.clientMobile,
        clientAddress: invoice.clientAddress,
        date: invoice.date || new Date().toISOString().split('T')[0],
        items: formattedItems,
      };

      const response = await axios.put(
        `${API_BASE_URL}/manual-invoices/${id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess("Invoice updated successfully!");
        setTimeout(() => {
          navigate("/invoices");
        }, 2000);
      } else {
        setError(response.data.message || "Failed to update invoice");
      }
    } catch (err) {
      console.error("Error updating invoice:", err);
      setError(
        err.response?.data?.message || 
        "Failed to update invoice. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const subtotal = calculateSubtotal();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <p className="mt-3 text-slate-600 font-medium">Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* COMPANY HEADER */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex justify-center md:justify-start">
            <img src={company.logo} alt="logo" className="h-12 md:h-auto" />
          </div>
          <div className="text-sm text-slate-600 space-y-1 text-center md:text-right">
            <p className="font-bold text-lg text-slate-800">{company.name}</p>
            <p>{company.address}</p>
            <p>{company.mobile}</p>
            <p>{company.email}</p>
            <p className="text-teal-600 font-medium">{company.website}</p>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-6 lg:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">
              Edit Invoice
            </h2>
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
            >
              ← Back to Invoices
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* INVOICE DATE */}
          <Field label="Invoice Date">
            <input
              type="date"
              name="date"
              value={invoice.date}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </Field>

          {/* CLIENT INFORMATION */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <Field label="Client Name">
              <input
                name="clientName"
                value={invoice.clientName}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Enter client name"
              />
            </Field>

            <Field label="Client Mobile">
              <input
                name="clientMobile"
                value={invoice.clientMobile}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Enter mobile number"
              />
            </Field>
          </div>

          <Field label="Client Address">
            <textarea
              name="clientAddress"
              value={invoice.clientAddress}
              onChange={handleChange}
              rows={3}
              className={`${inputClass} h-24 py-2`}
              placeholder="Enter client address"
            />
          </Field>

          {/* ITEMS SECTION */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="font-semibold text-lg text-slate-700">
                Item Details
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition"
              >
                + Add Item
              </button>
            </div>

            {invoice.items.map((item, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <span className="text-sm font-medium text-slate-600">
                    Item #{index + 1}
                    {item._id && (
                      <span className="ml-2 text-xs text-slate-400">
                        (ID: {item._id.slice(-6)})
                      </span>
                    )}
                  </span>
                  {invoice.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <Field label="Description">
                    <input
                      name="description"
                      value={item.description}
                      onChange={(e) => handleChange(e, index)}
                      required
                      className={inputClass}
                      placeholder="Item description"
                    />
                  </Field>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <Field label="Price (₹)">
                      <input
                        type="number"
                        name="price"
                        value={item.price}
                        onChange={(e) => handleChange(e, index)}
                        required
                        min="0"
                        step="1"
                        className={inputClass}
                        placeholder="0"
                      />
                    </Field>

                    <Field label="Quantity">
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleChange(e, index)}
                        required
                        min="1"
                        step="1"
                        className={inputClass}
                        placeholder="1"
                      />
                    </Field>

                    <Field label="Total">
                      <input
                        value={calculateItemTotal(item.price, item.quantity)}
                        readOnly
                        className={`${inputClass} bg-slate-100 font-semibold`}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}

            {/* Subtotal */}
            <div className="flex justify-end items-center border-t border-slate-200 pt-4 mt-4">
              <div className="text-right">
                <p className="text-sm text-slate-600">Subtotal</p>
                <p className="text-2xl font-bold text-slate-800">
                  ₹{subtotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm transition ${
                saving ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Updating Invoice...
                </span>
              ) : (
                "Update Invoice"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="flex-1 h-12 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold mb-2 text-slate-700">
      {label}
    </label>
    {children}
  </div>
);

export default EditInvoice;