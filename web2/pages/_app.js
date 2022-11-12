import '../styles/globals.css'
import { useState, useEffect } from 'react'
import { ethers, providers } from 'ethers'
import { css } from '@emotion/css'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { createClient, STORAGE_KEY, authenticate as authenticateMutation, getChallenge, getDefaultProfile, NASI_DAO_CONTRACT_ADDRESS, LENS_HUB_CONTRACT_ADDRESS } from '../api'
import { parseJwt, refreshAuthToken, getSigner, baseMetadata } from '../utils'
import { AppContext } from '../context'
import Modal from '../components/CreatePostModal'
import NASIDAONFT from '../abi/nasidaonft'
import LENSHUB from '../abi/lenshub'
import { v4 as uuid } from 'uuid'
import { create } from 'ipfs-http-client'

const projectId = '2HLYkz2xfBYoFG58z0Nld0wz3WW'
const projectSecret = '52790fce1af5f6992b984f619cedfc68'
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
const postClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
      authorization: auth,
  },
})

function MyApp({ Component, pageProps }) {
  const [connected, setConnected] = useState(true)
  const [userAddress, setUserAddress] = useState()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userProfile, setUserProfile] = useState()
  const [allOwners, setAllOwners] = useState()
  const [minted, setMinted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    refreshAuthToken()
    async function checkConnection() {
      const provider = new ethers.providers.Web3Provider(
        (window).ethereum
      )
      const addresses = await provider.listAccounts();
      if (addresses.length) {
        setConnected(true)
        setUserAddress(addresses[0])
        getUserProfile(addresses[0])
      } else {
        setConnected(false)
      }
    }
    checkConnection()
    listenForRouteChangeEvents()
    buildAllOwners()
  }, [])
  
  useEffect(() => {
    checkMint()
  }, [userProfile])

  async function getUserProfile(address) {
    try {
      const urqlClient = await createClient()
      const response = await urqlClient.query(getDefaultProfile, {
        address
      }).toPromise()
      setUserProfile(response.data.defaultProfile)
    } catch (err) {
      console.log('error fetching user profile...: ', err)
    }
  }

  async function listenForRouteChangeEvents() {
    router.events.on('routeChangeStart', () => {
      refreshAuthToken()
    })
  }

  async function signIn() {
    try {
      const accounts = await window.ethereum.send(
        "eth_requestAccounts"
      )
      setConnected(true)
      const account = accounts.result[0]
      setUserAddress(account)
      const urqlClient = await createClient()
      const response = await urqlClient.query(getChallenge, {
        address: account
      }).toPromise()
      const provider = new providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner()
      const signature = await signer.signMessage(response.data.challenge.text)
      const authData = await urqlClient.mutation(authenticateMutation, {
        address: account, signature
      }).toPromise()
      const { accessToken, refreshToken } = authData.data.authenticate
      const accessTokenData = parseJwt(accessToken)
      getUserProfile(account)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        accessToken, refreshToken, exp: accessTokenData.exp
      }))
    } catch (err) {
      console.log('error: ', err)
    }
  }

  async function buildAllOwners() {
    try {
      const contract = new ethers.Contract(
        NASI_DAO_CONTRACT_ADDRESS,
        NASIDAONFT,
        getSigner()
      )

      const nftOwners = await contract.getAllOwners()
      const profileIds = nftOwners.map((element) => {
        return element[1]
      })

      setAllOwners(profileIds)
    } catch (err) {
      console.log(err)
      setAllOwners([])
    }
  }

  async function checkMint() {
    try {
      if (typeof userProfile !== "undefined") {
        const owners = allOwners
        const profileId = userProfile.id

        if (owners.includes(profileId)) {
          setMinted(true)
        } else {
          setMinted(false)
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function buildAutoPost() {
    let metaData = {
      content: `@${userProfile.handle} joined NasiDAO Community`,
      description: `@${userProfile.handle} joined NasiDAO Community`,
      name: `Post by @${userProfile.handle}`,
      external_url: `https://lenster.xyz/u/${userProfile.handle}`,
      metadata_id: uuid(),
      createdOn: new Date().toISOString(),
      ...baseMetadata,
      media: [
        {
          "item": "ipfs://QmX3FJz4skkjTaMDAXUqpYuS1PtLs4fiMTXujUUJmrv1LU",
          "type": "image/jpeg"
        }
      ],
      mainContentFocus: "IMAGE"
    }

    const added = await postClient.add(JSON.stringify(metaData))
    const uri = `https://ipfs.io/ipfs/${added.path}`

    return uri
  }

  async function joinedPost() {
    const contentURI = await buildAutoPost()

    const contract = new ethers.Contract(
      LENS_HUB_CONTRACT_ADDRESS,
      LENSHUB,
      getSigner()
    )

    try {
      const postData = {
        profileId: userProfile.id,
        contentURI,
        collectModule: '0x23b9467334bEb345aAa6fd1545538F3d54436e96',
        collectModuleInitData: ethers.utils.defaultAbiCoder.encode(['bool'], [true]),
        referenceModule: '0x0000000000000000000000000000000000000000',
        referenceModuleInitData: []
      }

      const tx = await contract.post(postData)
      await tx.wait()
      setMinted(true)
      window.location.reload()
    } catch (err) {
      console.log('error: ', err)
    }
  }

  async function mintToken() {
    const contract = new ethers.Contract(
      NASI_DAO_CONTRACT_ADDRESS,
      NASIDAONFT,
      getSigner()
    )

    try {
      const tx = await contract.registerOwner(userAddress, userProfile.id)
      await tx.wait()

      await joinedPost()
    } catch (err) {
      console.log(err)
      setMinted(false)
    }
  }

  return (
    <AppContext.Provider value={{
      userAddress,
      profile: userProfile,
      allOwners,
      minted
    }}>
      <div>
        <nav className={navStyle}>
          <div className={navContainerStyle}>
            <div className={linkContainerStyle}>
              <Link href='/'>
                <a>
                  <img src="/icon.svg" className={iconStyle} />
                </a>
              </Link>
              <Link href='/'>
                <a>
                  <p className={linkTextStyle}>Home</p>
                </a>
              </Link>
            </div>
            <div className={buttonContainerStyle}>
              {
                !connected && (
                  <button className={buttonStyle} onClick={signIn}>Sign in</button>
                )
              }
              {
                connected && (
                  <div>
                    {
                      !minted ? (
                        <button className={buttonStyle} onClick={mintToken}>Mint NFT</button>
                      ) : (
                        <div>
                          <button className={buttonStyleMinted} disabled="disabled">Minted</button>
                          <button
                            className={modalButtonStyle}
                            onClick={() => setIsModalOpen(true)}>
                            <img
                              src="/create-post.svg"
                              className={createPostStyle}
                            />
                          </button>
                        </div>
                      )
                    }
                  </div>
                )
              }
            </div>
          </div>
        </nav>
        <div className={appLayoutStyle}>
          <Component {...pageProps} />
        </div>
        {
          isModalOpen && (
            <Modal
              setIsModalOpen={setIsModalOpen}
            />
          )
        }
      </div>
    </AppContext.Provider>
  )
}

const appLayoutStyle = css`
  width: 900px;
  margin: 0 auto;
  padding: 78px 0px 50px;
`

const linkTextStyle = css`
  margin-right: 40px;
  font-weight: 600;
  font-size: 15px;
`

const iconStyle = css`
  height: 35px;
  margin-right: 40px;
`

const modalButtonStyle = css`
  background-color: transparent;
  outline: none;
  border: none;
  cursor: pointer;
`

const createPostStyle = css`
  height: 35px;
  margin-right: 5px;
`

const navStyle = css`
  background-color: white;
  padding: 15px 30px;
  display: flex;
  position: fixed;
  width: 100%;
  background-color: white;
  z-index: 1;
  border-bottom: 1px solid #ededed;
`

const navContainerStyle = css`
  width: 900px;
  margin: 0 auto;
  display: flex;
`

const linkContainerStyle = css`
  display: flex;
  align-items: center;
`

const buttonContainerStyle = css`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  flex: 1;
`

const buttonStyle = css`
  border: none;
  outline: none;
  margin-left: 15px;
  background-color: black;
  color: #340036;
  padding: 13px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background-color: rgb(249, 92, 255);
  transition: all .35s;
  width: 160px;
  letter-spacing: .75px;
  &:hover {
    background-color: rgba(249, 92, 255, .75);
  }
`

const buttonStyleMinted = css`
  border: none;
  outline: none;
  margin-left: 15px;
  background-color: white;
  color: #340036;
  padding: 13px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background-color: rgb(235, 235, 228);
  transition: all .35s;
  width: 160px;
  letter-spacing: .75px;
  &:hover {
    background-color: rgba(235, 235, 228, .75);
  }
`

export default MyApp
