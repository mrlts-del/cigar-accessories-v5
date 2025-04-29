import React from 'react';
import Container from '@/components/ui/container';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Payment Methods */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
            <ul className="space-y-2">
              <li>Visa</li>
              <li>MasterCard</li>
              <li>Apple Pay</li>
              <li>LinePay</li>
              <li>JKO Pay</li>
            </ul>
          </div>

          {/* Column 2: Shipping Policy */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shipping Policy</h3>
            <p>Free shipping on all orders over NTD$3000</p>
          </div>

          {/* Column 3: Contact Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;