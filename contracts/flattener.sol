// File: @openzeppelin\contracts\math\SafeMath.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

// File: @openzeppelin\contracts\cryptography\ECDSA.sol

pragma solidity >=0.6.0 <0.8.0;

/**
 * @dev Elliptic Curve Digital Signature Algorithm (ECDSA) operations.
 *
 * These functions can be used to verify that a message was signed by the holder
 * of the private keys of a given address.
 */
library ECDSA {
    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature`. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM opcode allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {toEthSignedMessageHash} on it.
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        // Check the signature length
        if (signature.length != 65) {
            revert("ECDSA: invalid signature length");
        }

        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "ECDSA: invalid signature 's' value");
        require(v == 27 || v == 28, "ECDSA: invalid signature 'v' value");

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "ECDSA: invalid signature");

        return signer;
    }

    /**
     * @dev Returns an Ethereum Signed Message, created from a `hash`. This
     * replicates the behavior of the
     * https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign[`eth_sign`]
     * JSON-RPC method.
     *
     * See {recover}.
     */
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        // 32 is the length in bytes of hash,
        // enforced by the type signature above
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}

// File: contracts\Registry.sol

pragma solidity ^0.7.0;



contract Registry {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    struct Store {
        mapping(address=>uint256) statusDID;
        mapping(bytes32=>uint256) statusVC;
        uint256 nonceDID;
        uint256 nonceVC;
    }
    mapping(address=>Store) registry;
    mapping(bytes32=>bool) usedSigs;

    event DID(address indexed _issuer, address indexed _did, uint256 indexed _revokeCode);
    event VC(address indexed _issuer, bytes32 indexed _hash, uint256 indexed _revokeCode);

    function GetRevokeCodeDID(address _did, address _issuer) external view returns (uint256) {
        return registry[_issuer].statusDID[_did];
    }

    function GetNonceDID(address _issuer) external view returns (uint256) {
        return registry[_issuer].nonceDID.add(1);
    }

    function _SetRevokeCodeDID(
        address _did,
        uint256 _revokeCode,
        uint256 _nonce,
        address _issuer) internal returns (bool) {
        uint256 nonce = registry[_issuer].nonceDID.add(1);
        require(_nonce == nonce);

        registry[_issuer].statusDID[_did] = _revokeCode;
        registry[_issuer].nonceDID = nonce;
        emit DID(_issuer, _did, _revokeCode);

        return true;
    }

    function SetRevokeCodeDID(
        address _did,
        uint256 _revokeCode,
        uint256 _nonce) external {
        require(_SetRevokeCodeDID(_did, _revokeCode, _nonce, msg.sender));
    }

    function GetRevokeCodeVC(bytes32 _hash, address _issuer) external view returns (uint256) {
        return registry[_issuer].statusVC[_hash];
    }

    function GetNonceVC(address _issuer) external view returns (uint256) {
        return registry[_issuer].nonceVC.add(1);
    }

    function _SetRevokeCodeVC(
        bytes32 _hash,
        uint256 _revokeCode,
        uint256 _nonce,
        address _issuer) internal returns (bool) {
        uint256 nonce = registry[_issuer].nonceVC.add(1);
        require(_nonce == nonce);
        require(_revokeCode > 0 && registry[_issuer].statusVC[_hash] == 0);

        registry[_issuer].statusVC[_hash] = _revokeCode;
        registry[_issuer].nonceVC = nonce;
        emit VC(_issuer, _hash, _revokeCode);

        return true;
    }

    function SetRevokeCodeVC(
        bytes32 _hash,
        uint256 _revokeCode,
        uint256 _nonce) external {
        require(_SetRevokeCodeVC(_hash, _revokeCode, _nonce, msg.sender));
    }

    // MetaTx
    function verify(
        address _signer,
        bytes memory _sig,
        bytes memory _encodeWithSelector) private returns (bool) {
        bytes32 _hash = keccak256(_encodeWithSelector);
        require(!usedSigs[_hash]);
        require(_hash.toEthSignedMessageHash().recover(_sig) == _signer);
        usedSigs[_hash] = true;
        return true;
    }

    function SetRevokeCodeDID2(
        address _did,
        uint256 _revokeCode,
        uint256 _nonce,
        address _signer,
        bytes memory _sig) external {
        // "14ea246d": "SetRevokeCodeDID(address,uint256,uint256)"
        bytes memory _encodeWithSelector = abi.encodeWithSelector(bytes4(0x14ea246d), _did, _revokeCode, _nonce);
        require(verify(_signer, _sig, _encodeWithSelector));
        require(_SetRevokeCodeDID(_did, _revokeCode, _nonce, _signer));
    }

    function SetRevokeCodeVC2(
        bytes32 _hash,
        uint256 _revokeCode,
        uint256 _nonce,
        address _signer,
        bytes memory _sig) external {
        // "3d0e441a": "SetRevokeCodeVC(bytes32,uint256,uint256)",
        bytes memory _encodeWithSelector = abi.encodeWithSelector(bytes4(0x3d0e441a), _hash, _revokeCode, _nonce);
        require(verify(_signer, _sig, _encodeWithSelector));
        require(_SetRevokeCodeVC(_hash, _revokeCode, _nonce, _signer));
    }
}
