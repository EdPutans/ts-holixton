//#region STATE STUFF

import { BagItem, Item, State, Tab, User } from "./types"

let state: State = {
  store: [],
  tab: 'Home',
  modal: '',
  search: '',
  user: null,
  selectedItem: null,
  bag: []
}

function setState(newState: Partial<State>): void {
  state = { ...state, ...newState }
  render()
}

function addToBag(itemId: number) {
  const match = state.bag.find(bagItem => bagItem.id === itemId)

  if (match) {
    const updatedBag: BagItem[] = state.bag.map(bagItem =>
      bagItem.id === itemId
        ? { ...bagItem, quantity: bagItem.quantity + 1 }
        : bagItem
    )
    setState({ bag: updatedBag })
  } else {
    const updatedBag = [...state.bag, { id: itemId, quantity: 1 }]
    setState({ bag: updatedBag })
  }

  if (!state.user) return;

  updateUser({
    ...state.user,
    bag: state.bag
  })
}

function removeFromBag(itemId: number): void {
  setState({ bag: state.bag.filter(bagItem => bagItem.id !== itemId) })

  if (!state.user) return;
  updateUser({ ...state.user, bag: state.bag })
}

function signIn({ bag, ...user }: User) {
  setState({ bag, user })
  localStorage.email = user.id
}

function signOut() {
  setState({ user: null, bag: [] })
  localStorage.removeItem('email')
}

//#endregion STATE STUFF

//#region SERVER STUFF

const baseUrl = 'http://localhost:3000'
const storeUrl = baseUrl + '/store'
const usersUrl = baseUrl + '/users'

function getStore() {
  return fetch(storeUrl).then(resp => resp.json())
}

function getUser(email: string) {
  return fetch(`${usersUrl}/${email}`).then(resp => resp.json())
}

function getSignedInUser() {
  if (!localStorage.email)
    return Promise.reject({ error: 'No user signed in.' })
  return getUser(localStorage.email)
}

function updateUser(user: User) {
  return fetch(`${usersUrl}/${user.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  })
}

function serverSignIn(email: string, password: string):
  Promise<{ user: User } | { error: string }> {
  return getUser(email).then(user => {
    if (user.password !== password) {
      return { error: 'Username/password invalid' }
    }
    return user
  })
}

//#endregion SERVER STUFF

//#region HELPER STUFF

function daysSince(date: string) {
  const dayInMs = 1000 * 60 * 60 * 24
  const timeInMsSinceDate = Date.now() - Date.parse(date)
  return Math.floor(timeInMsSinceDate / dayInMs)
}

//#endregion HELPER STUFF

//#region PAGE STUFF

function ProductCard(storeItem: Item) {
  const productCardEl = document.createElement('div')
  productCardEl.setAttribute('class', 'product-card')

  if (daysSince(storeItem.dateEntered) < 10) {
    const newLabel = document.createElement('span')
    newLabel.setAttribute('class', 'product-card__new-label')
    newLabel.innerText = 'NEW!'
    productCardEl.append(newLabel)
  }

  const topEl = document.createElement('div')
  topEl.setAttribute('class', 'product-card__top')

  const imgEl = document.createElement('img')
  topEl.setAttribute('class', 'product-card__image')
  imgEl.setAttribute('src', storeItem.image + '?policy=product-small')

  imgEl.addEventListener('click', () => {
    setState({ selectedItem: storeItem })
  })

  topEl.append(imgEl)

  const bottomEl = document.createElement('div')
  bottomEl.setAttribute('class', 'product-card__bottom')

  const nameEl = document.createElement('p')
  nameEl.setAttribute('class', 'product-card__name')
  nameEl.innerText = storeItem.name

  const priceSectionEl = document.createElement('div')
  priceSectionEl.setAttribute('class', 'product-card__price-section')

  const originalPriceEl = document.createElement('p')
  originalPriceEl.setAttribute('class', 'product-card__price')
  originalPriceEl.innerText = `£${storeItem.price}`

  priceSectionEl.append(originalPriceEl)

  if (storeItem.discountedPrice) {
    originalPriceEl.classList.add('discounted')
    const discountedPriceEl = document.createElement('p')
    discountedPriceEl.setAttribute('class', 'product-card__discounted-price')
    discountedPriceEl.innerText = `£${storeItem.discountedPrice}`
    priceSectionEl.append(discountedPriceEl)
  }

  bottomEl.append(nameEl, priceSectionEl)

  productCardEl.append(topEl, bottomEl)

  return productCardEl
}

function HeaderLeft() {
  const leftEl = document.createElement('div')
  leftEl.className = 'header__left'

  const logoLink = document.createElement('a')
  logoLink.addEventListener('click', () => {
    setState({ tab: 'Home', selectedItem: null })
  })
  const logoH1 = document.createElement('h1')
  logoH1.setAttribute('class', 'logo')
  logoH1.innerText = 'Hollixton'
  logoLink.append(logoH1)
  leftEl.append(logoLink)

  for (const menuText of ['Girls', 'Guys', 'Sale'] as Tab[]) {
    const menuEl = document.createElement('a')
    menuEl.innerText = menuText
    menuEl.addEventListener('click', () => {
      setState({ tab: menuText, selectedItem: null })
    })
    leftEl.append(menuEl)
  }

  return leftEl
}

function HeaderRight() {
  const rightEl = document.createElement('div')
  rightEl.className = 'header__right'

  const searchLink = document.createElement('a')
  const searchImgEl = document.createElement('img')
  searchImgEl.src = '/assets/icons/search.svg'
  searchImgEl.addEventListener('click', () => {
    setState({ modal: 'Search' })
  })
  searchLink.append(searchImgEl)

  const profileLink = document.createElement('a')
  profileLink.addEventListener('click', () => {
    setState({ modal: state.user ? 'Profile' : 'SignIn' })
  })
  const profileImgEl = document.createElement('img')
  profileImgEl.src = '/assets/icons/user.svg'
  profileLink.append(profileImgEl)

  const bagLink = document.createElement('a')
  bagLink.className = 'header__bag-link'
  bagLink.addEventListener('click', () => {
    setState({ modal: 'Bag' })
  })

  const bagImgEl = document.createElement('img')
  bagImgEl.src = '/assets/icons/bag.svg'

  const bagCountEl = document.createElement('span')
  bagCountEl.className = 'header__bag-link__bag-count'
  bagCountEl.innerText = state.bag.length.toString()

  bagLink.append(bagImgEl, bagCountEl)

  rightEl.append(searchLink, profileLink, bagLink)

  return rightEl
}

function Header() {
  const headerEl = document.createElement('header')

  const leftEl = HeaderLeft()
  const rightEl = HeaderRight()

  headerEl.append(leftEl, rightEl)

  return headerEl
}

function ProductDetails() {
  if (!state.selectedItem) return

  const productDetailsSectionEl = document.createElement('div')
  productDetailsSectionEl.setAttribute('class', 'product-details-section')

  const productDetailsEl = document.createElement('div')
  productDetailsEl.setAttribute('class', 'product-details')

  const imgEl = document.createElement('img')
  imgEl.setAttribute('src', state.selectedItem.image + '?policy=product-large')

  const productInfoEl = document.createElement('div')
  productInfoEl.setAttribute('class', 'product-details__info')

  const titleEl = document.createElement('h2')
  titleEl.setAttribute('class', 'product-details__info__title')
  titleEl.innerText = state.selectedItem.name

  const addToBagBtn = document.createElement('button')
  addToBagBtn.setAttribute('class', 'product-details__add-to-bag')
  addToBagBtn.innerText = 'ADD TO BAG'
  addToBagBtn.addEventListener('click', () => {
    if (state.selectedItem)
      addToBag(state.selectedItem.id);

    setState({ selectedItem: null })
  })

  productInfoEl.append(titleEl, addToBagBtn)
  productDetailsEl.append(imgEl, productInfoEl)
  productDetailsSectionEl.append(productDetailsEl)

  return productDetailsSectionEl
}

function ProductCards() {
  const productCardSectionEl = document.createElement('div')

  const titleEl = document.createElement('h2')
  titleEl.setAttribute('class', 'main__title')
  titleEl.innerText = state.tab

  productCardSectionEl.append(titleEl)

  const productCardsEl = document.createElement('div')
  productCardsEl.className = 'main__product-card-list'

  let productsToRender = state.store;
  if (state.tab === 'Girls') {
    productsToRender = state.store.filter(
      storeItem => storeItem.type === 'Girls'
    )
  }
  if (state.tab === 'Guys') {
    productsToRender = state.store.filter(
      storeItem => storeItem.type === 'Guys'
    )
  }
  if (state.tab === 'Sale') {
    productsToRender = state.store.filter(
      storeItem => storeItem.discountedPrice
    )
  }

  if (state.search) {
    productsToRender = productsToRender.filter(item =>
      item.name.toLowerCase().includes(state.search.toLowerCase())
    )

    if (productsToRender.length === 0) {
      const emptyProductsEl = document.createElement('p')
      emptyProductsEl.innerText = 'No products matched your search.'
      productCardSectionEl.append(emptyProductsEl)
    }
  }

  for (const item of productsToRender) {
    const productCardEl = ProductCard(item)
    productCardsEl.append(productCardEl)
  }

  productCardSectionEl.append(productCardsEl)

  return productCardSectionEl
}

function Main() {
  const mainEl = document.createElement('main')

  if (state.selectedItem) {
    const productDetailsEl = ProductDetails();
    if (productDetailsEl) mainEl.append(productDetailsEl)
  } else {
    if (state.search) {
      const currentSearchEl = document.createElement('h3')
      currentSearchEl.setAttribute('class', 'main__current-search')
      currentSearchEl.innerText = `Current search: ${state.search}`

      const clearSearchBtn = document.createElement('button')
      clearSearchBtn.setAttribute('class', 'main__current-search__clear-search')
      clearSearchBtn.innerText = 'X'
      clearSearchBtn.addEventListener('click', () => {
        setState({ search: '' })
      })

      currentSearchEl.append(clearSearchBtn)

      mainEl.append(currentSearchEl)
    }
    const productCardsEl = ProductCards()
    mainEl.append(productCardsEl)
  }

  return mainEl
}

function Footer() {
  const footerEl = document.createElement('footer')

  const companyNameEl = document.createElement('p')
  companyNameEl.setAttribute('class', 'footer__company-name logo')
  companyNameEl.innerText = 'Hollixton'

  const countryEl = document.createElement('p')
  countryEl.setAttribute('class', 'footer__country')
  countryEl.innerText = '🇬🇧 United Kingdom'

  footerEl.append(companyNameEl, countryEl)

  return footerEl
}

function SearchModal() {
  const modalContentsEl = document.createElement('div')
  modalContentsEl.setAttribute('class', 'search-modal modal-contents')

  const titleEl = document.createElement('h2')
  titleEl.setAttribute('class', 'search-modal__title')
  titleEl.innerText = 'Search for your favourite items!'

  const formEl = document.createElement('form')
  formEl.setAttribute('class', 'search-modal__form')

  const searchBarEl = document.createElement('input')
  searchBarEl.setAttribute('class', 'search-modal__search-bar')
  searchBarEl.setAttribute('type', 'search')
  searchBarEl.setAttribute('name', 'search')
  searchBarEl.setAttribute('placeholder', 'Search...')
  setTimeout(() => {
    searchBarEl.focus()
    searchBarEl.value = state.search
  })

  formEl.addEventListener('submit', e => {
    e.preventDefault()
    setState({ search: formEl.search.value, modal: '', selectedItem: null })
  })

  formEl.append(searchBarEl)
  modalContentsEl.append(titleEl, formEl)

  return modalContentsEl
}

function SignInModal() {
  const modalContentsEl = document.createElement('div')
  modalContentsEl.setAttribute('class', 'sign-in-modal modal-contents')

  const titleEl = document.createElement('h2')
  titleEl.setAttribute('class', 'profile-modal__title')
  titleEl.innerText = 'Sign In'

  const formEl = document.createElement('form')
  formEl.setAttribute('class', 'profile-modal__sign-in-form')

  const emailLabel = document.createElement('label')
  emailLabel.setAttribute('for', 'email')
  emailLabel.innerText = 'Email'

  const emailInput = document.createElement('input')
  emailInput.setAttribute('id', 'email')
  emailInput.setAttribute('type', 'email')
  emailInput.setAttribute('name', 'email')
  emailInput.setAttribute('required', 'true')

  const passwordLabel = document.createElement('label')
  passwordLabel.setAttribute('for', 'password')
  passwordLabel.innerText = 'Password'

  const passwordInput = document.createElement('input')
  passwordInput.setAttribute('id', 'password')
  passwordInput.setAttribute('name', 'password')
  passwordInput.setAttribute('type', 'password')
  passwordInput.setAttribute('required', 'true')

  const signInBtn = document.createElement('button')
  signInBtn.setAttribute('type', 'submit')
  signInBtn.innerText = 'SIGN IN'

  formEl.append(emailLabel, emailInput, passwordLabel, passwordInput, signInBtn)

  formEl.addEventListener('submit', e => {
    e.preventDefault()
    serverSignIn(formEl.email.value, formEl.password.value).then(data => {
      if ('error' in data) {
        alert(data.error)
      } else {
        signIn(data.user)
        setState({ modal: '' })
      }
    })
  })

  modalContentsEl.append(titleEl, formEl)
  return modalContentsEl
}

function ProfileModal() {
  const modalContentsEl = document.createElement('div')
  modalContentsEl.setAttribute('class', 'profile-modal modal-contents')

  const titleEl = document.createElement('h2')
  titleEl.setAttribute('class', 'profile-modal__title')
  titleEl.innerText = 'Profile'

  const greetingEl = document.createElement('p')
  greetingEl.setAttribute('class', 'profile-modal__greeting')
  greetingEl.innerText = `Hey, ${state.user?.firstName}!`

  const signOutBtn = document.createElement('button')
  signOutBtn.setAttribute('class', 'profile-modal__sign-out')
  signOutBtn.innerText = 'SIGN OUT'
  signOutBtn.addEventListener('click', () => {
    signOut()
    setState({ modal: '' })
  })
  modalContentsEl.append(titleEl, greetingEl, signOutBtn)

  return modalContentsEl
}

function BagItem(bagItem: BagItem): HTMLElement {
  const storeItem = state.store.find(storeItem => storeItem.id === bagItem.id);

  const bagItemEl = document.createElement('div')
  bagItemEl.setAttribute('class', 'bag-item')

  const imgEl = document.createElement('img')
  imgEl.setAttribute('class', 'bag-item__image')
  imgEl.src = storeItem?.image + '?policy=product-small'

  const infoEl = document.createElement('div')
  infoEl.setAttribute('class', 'bag-item__info')

  const nameEl = document.createElement('h3')
  nameEl.setAttribute('class', 'bag-item__name')

  nameEl.innerText = storeItem?.name || '';
  nameEl.addEventListener('click', () => {
    setState({ modal: '', selectedItem: storeItem })
  })

  const priceSectionEl = document.createElement('div')
  priceSectionEl.setAttribute('class', 'bag-item__price-section')

  const originalPriceEl = document.createElement('p')
  originalPriceEl.setAttribute('class', 'bag-item__price')
  //@ts-ignore
  originalPriceEl.innerText = `£${storeItem.price}`

  priceSectionEl.append(originalPriceEl)
  //@ts-ignore
  if (storeItem.discountedPrice) {
    originalPriceEl.classList.add('discounted')
    const discountedPriceEl = document.createElement('p')
    discountedPriceEl.setAttribute('class', 'bag-item__discounted-price')
    //@ts-ignore
    discountedPriceEl.innerText = `£${storeItem.discountedPrice}`
    priceSectionEl.append(discountedPriceEl)
  }

  const quantityEl = document.createElement('p')
  quantityEl.setAttribute('class', 'bag-item__quantity')
  quantityEl.innerText = `(x${bagItem.quantity})`

  priceSectionEl.append(quantityEl)

  const removeBtn = document.createElement('button')
  removeBtn.setAttribute('class', 'bag-item__remove secondary')
  removeBtn.innerText = 'REMOVE'
  removeBtn.addEventListener('click', () => {
    //@ts-ignore
    removeFromBag(storeItem.id)
  })

  infoEl.append(nameEl, priceSectionEl, removeBtn)

  bagItemEl.append(imgEl, infoEl)

  return bagItemEl
}

function BagModal() {
  const modalContentsEl = document.createElement('div')
  modalContentsEl.setAttribute('class', 'bag-modal modal-contents')

  const titleEl = document.createElement('h2')
  titleEl.innerText = 'Bag'
  modalContentsEl.append(titleEl)

  if (state.bag.length > 0) {
    for (const bagItem of state.bag) {
      const bagItemEl = BagItem(bagItem)
      modalContentsEl.append(bagItemEl)
    }

    let total = 0

    for (const bagItem of state.bag) {
      const storeItem = state.store.find(
        storeItem => storeItem.id === bagItem.id
      )
      //@ts-ignore
      total += (storeItem.discountedPrice || storeItem.price) * bagItem.quantity
    }

    const payBtn = document.createElement('button')
    payBtn.setAttribute('class', 'pay')
    payBtn.innerText = `Pay now: £${total.toFixed(2)}`
    modalContentsEl.append(payBtn)
  } else {
    const emptyBagEl = document.createElement('p')
    emptyBagEl.innerText = 'Your bag is currently empty.'
    modalContentsEl.append(emptyBagEl)
  }

  return modalContentsEl
}

const modals = {
  Search: SearchModal,
  Profile: ProfileModal,
  Bag: BagModal,
  SignIn: SignInModal
}

function Modal() {
  if (state.modal === '') return

  const modalWrapperEl = document.createElement('div')
  modalWrapperEl.setAttribute('class', 'modal-wrapper')
  modalWrapperEl.addEventListener('click', () => {
    setState({ modal: '' })
  })

  const modalEl = document.createElement('div')
  modalEl.setAttribute('class', 'modal')
  modalEl.addEventListener('click', e => {
    e.stopPropagation()
  })

  const modalCloseBtn = document.createElement('button')
  modalCloseBtn.setAttribute('class', 'close-modal')
  modalCloseBtn.innerText = 'X'
  modalCloseBtn.addEventListener('click', () => {
    setState({ modal: '' })
  })
  //@ts-ignore
  modalEl.append(modalCloseBtn, modals[state.modal]())

  modalWrapperEl.append(modalEl)

  return modalWrapperEl
}

function render() {
  document.body.innerHTML = ''

  const headerEl = Header()
  const mainEl = Main()
  const footerEl = Footer()

  document.body.append(headerEl, mainEl, footerEl)

  if (state.modal) {
    const modalEl = Modal()
    //@ts-ignore
    document.body.append(modalEl)
  }
}

//#endregion PAGE STUFF

function init() {
  render()
  getStore().then(store => setState({ store }))
  getSignedInUser().then(signIn)
}

init()
