export default function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Don Negro Comercial',
    description: 'Comercial de electrónica, electrodomésticos, muebles, indumentaria deportiva y aire acondicionado en Asunción, Paraguay',
    url: 'https://www.donegro.com',
    telephone: '+595981800198',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Asunción Supercentro Local 121, Planta Baja, Oliva c/ 14 de Mayo',
      addressLocality: 'Asunción',
      addressCountry: 'PY'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -25.282825,
      longitude: -57.638153
    },
    sameAs: [
      'https://wa.me/595975500330',
      'https://wa.me/595981800198'
    ],
    priceRange: '₲₲',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '12:00'
      }
    ],
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card'],
    currenciesAccepted: 'PYG'
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Don Negro Comercial',
    url: 'https://www.donegro.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.donegro.com/productos?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://www.donegro.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Productos',
        item: 'https://www.donegro.com/productos'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
