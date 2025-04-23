;; Vendor Verification Contract
;; This contract validates qualified government suppliers

(define-data-var admin principal tx-sender)

;; Data structure for vendor information
(define-map vendors
  { vendor-id: principal }
  {
    name: (string-utf8 100),
    registration-number: (string-utf8 50),
    category: (string-utf8 50),
    verified: bool,
    verification-date: uint
  }
)

;; Public function to register as a vendor
(define-public (register-vendor (name (string-utf8 100)) (registration-number (string-utf8 50)) (category (string-utf8 50)))
  (let ((vendor-id tx-sender))
    (if (is-vendor vendor-id)
      (err u1) ;; Already registered
      (begin
        (map-set vendors
          { vendor-id: vendor-id }
          {
            name: name,
            registration-number: registration-number,
            category: category,
            verified: false,
            verification-date: u0
          }
        )
        (ok true)
      )
    )
  )
)

;; Admin function to verify a vendor
(define-public (verify-vendor (vendor-id principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403)) ;; Only admin can verify
    (asserts! (is-vendor vendor-id) (err u404)) ;; Vendor must exist

    (let ((vendor-data (unwrap-panic (map-get? vendors { vendor-id: vendor-id }))))
      (map-set vendors
        { vendor-id: vendor-id }
        (merge vendor-data {
          verified: true,
          verification-date: block-height
        })
      )
      (ok true)
    )
  )
)

;; Admin function to reject a vendor
(define-public (reject-vendor (vendor-id principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403)) ;; Only admin can reject
    (asserts! (is-vendor vendor-id) (err u404)) ;; Vendor must exist

    (map-delete vendors { vendor-id: vendor-id })
    (ok true)
  )
)

;; Function to check if an address is a verified vendor
(define-read-only (is-verified-vendor (vendor-id principal))
  (match (map-get? vendors { vendor-id: vendor-id })
    vendor-data (get verified vendor-data)
    false
  )
)

;; Function to check if an address is a registered vendor
(define-read-only (is-vendor (vendor-id principal))
  (is-some (map-get? vendors { vendor-id: vendor-id }))
)

;; Function to get vendor details
(define-read-only (get-vendor-details (vendor-id principal))
  (map-get? vendors { vendor-id: vendor-id })
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (var-set admin new-admin)
    (ok true)
  )
)
