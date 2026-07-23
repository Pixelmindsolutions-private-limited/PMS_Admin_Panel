// CreateInvoice.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from '../../assets/logo1.png'

const inputClass =
  "w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

const company = {
  logo: logo,
  name: "Pixelmindsolutions Pvt Ltd",
  mobile: "+91 9666317749",
  address: "kphb, Hyderabad, India",
  email: "info@pixelmindsolutions.com",
  website: "www.pixelmindsolutions.com",
};

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api";

const CreateInvoice = () => {
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
        total: 0,
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setInvoice(prev => ({
      ...prev,
      date: today
    }));
  }, []);

  // Calculate item total
  const calculateItemTotal = (price, quantity) => {
    return (Number(price) || 0) * (Number(quantity) || 0);
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => {
      return sum + calculateItemTotal(item.price, item.quantity);
    }, 0);
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;

    if (index !== undefined) {
      // Handle item field change
      const updatedItems = [...invoice.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: value,
      };

      // Auto-calculate total for this item
      if (name === "price" || name === "quantity") {
        updatedItems[index].total = calculateItemTotal(
          name === "price" ? value : updatedItems[index].price,
          name === "quantity" ? value : updatedItems[index].quantity
        );
      }

      setInvoice((prev) => ({
        ...prev,
        items: updatedItems,
      }));
    } else {
      // Handle client field change
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
          total: 0,
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
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Format data for API
      const formattedItems = invoice.items.map((item) => ({
        description: item.description,
        price: Number(item.price),
        quantity: Number(item.quantity),
      }));

      const payload = {
        clientName: invoice.clientName,
        clientMobile: invoice.clientMobile,
        clientAddress: invoice.clientAddress,
        date: invoice.date || new Date().toISOString().split('T')[0],
        items: formattedItems,
      };

      const response = await axios.post(
        `${API_BASE_URL}/manual-invoices`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Invoice created successfully! PDF is being generated.",
        });

        // Reset form
        const today = new Date().toISOString().split('T')[0];
        setInvoice({
          clientName: "",
          clientMobile: "",
          clientAddress: "",
          date: today,
          items: [
            {
              description: "",
              price: "",
              quantity: "",
              total: 0,
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create invoice. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* COMPANY HEADER */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex justify-center md:justify-start">
            <img src={company.logo} alt="logo" className="h-16 w-16 md:h-20 md:w-20 object-contain" />
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
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            Create Invoice
          </h2>

          {/* Message Alert */}
          {message.text && (
            <div
              className={`p-4 rounded-xl ${message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
                }`}
            >
              <div className="flex items-start gap-2">
                {message.type === "success" ? (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{message.text}</span>
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm transition ${loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Creating Invoice...
              </span>
            ) : (
              "Create Invoice"
            )}
          </button>
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

export default CreateInvoice;